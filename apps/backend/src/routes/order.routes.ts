import { Router, Response } from 'express'
import { z } from 'zod'
import { prisma } from '../lib/prisma'
import { requireAuth, requireRole, AuthenticatedRequest } from '../middleware/auth.middleware'
import { logAction } from '../middleware/activityLog.middleware'
import { OrderStatus, PaymentStatus } from '@prisma/client'
import { CacheService } from '../services/cache.service'
import { ShiprocketService } from '../services/shiprocket.service'
import { BrevoService } from '../services/brevo.service'
import LRU from 'lru-cache'
import crypto from 'crypto'

const router = Router()

// Idempotency cache stored for 5 minutes in memory, limit to 1000 requests max
const idempotencyCache = new LRU<string, any>({
  max: 1000,
  maxAge: 5 * 60 * 1000 // 5 minutes TTL
})

// Helper to calculate effective variant price
function getEffectivePrice(variant: any, product: any): number {
  return variant.priceOverride ?? product.discountPrice ?? product.basePrice
}

// Helper to query the cart with standard includes
async function getFullCart(userId: string) {
  return prisma.cart.findUnique({
    where: { userId },
    include: {
      items: {
        orderBy: { createdAt: 'asc' },
        include: {
          productVariant: {
            include: {
              product: {
                include: {
                  images: { orderBy: { position: 'asc' } },
                  variants: true
                }
              }
            }
          }
        }
      }
    }
  })
}

const checkoutSchema = z.object({
  addressId: z.string().min(1, 'addressId is required'),
  paymentMethod: z.enum(['online', 'cod']),
  couponCode: z.string().optional().nullable()
})

const updateStatusSchema = z.object({
  status: z.nativeEnum(OrderStatus),
  notes: z.string().optional()
})

/**
 * Validates whether transition from 'from' status to 'to' status is legal.
 */
function isValidTransition(from: OrderStatus, to: OrderStatus): boolean {
  if (from === to) return true
  if (from === OrderStatus.delivered || from === OrderStatus.cancelled) return false

  const workflow: Record<OrderStatus, OrderStatus[]> = {
    placed: [OrderStatus.confirmed, OrderStatus.cancelled],
    confirmed: [OrderStatus.packed, OrderStatus.cancelled],
    packed: [OrderStatus.shipped, OrderStatus.cancelled],
    shipped: [OrderStatus.out_for_delivery, OrderStatus.cancelled],
    out_for_delivery: [OrderStatus.delivered, OrderStatus.cancelled],
    delivered: [],
    cancelled: []
  }

  return workflow[from]?.includes(to) ?? false
}

/**
 * POST /api/orders/checkout
 * Placed order based on active cart. Supports COD (with atomic stock check) and Online (Razorpay) stubs.
 */
router.post('/orders/checkout', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  const idempotencyKey = req.headers['idempotency-key'] as string | undefined

  if (idempotencyKey) {
    const cachedResponse = idempotencyCache.get(idempotencyKey)
    if (cachedResponse) {
      if (cachedResponse.status === 'pending') {
        return res.status(409).json({ error: 'A checkout request is already in progress with this key. Please wait.' })
      }
      console.log(`[Checkout Idempotency] Duplicate request detected for key: ${idempotencyKey}. Returning cached response.`)
      return res.status(cachedResponse.status).json(cachedResponse.body)
    }
    idempotencyCache.set(idempotencyKey, { status: 'pending' })
  }

  const sendJson = (status: number, body: any) => {
    if (idempotencyKey) {
      if (status >= 200 && status < 300) {
        idempotencyCache.set(idempotencyKey, { status, body })
      } else {
        idempotencyCache.del(idempotencyKey)
      }
    }
    return res.status(status).json(body)
  }

  try {
    const data = checkoutSchema.parse(req.body)
    const userId = req.user!.id

    const cart = await getFullCart(userId)
    if (!cart || cart.items.length === 0) {
      return sendJson(400, { error: 'Your cart is empty.' })
    }

    // 1. Revalidate prices and stock
    let subtotal = 0
    for (const item of cart.items) {
      const variant = item.productVariant
      if (!variant || variant.product.status === 'archived') {
        return sendJson(400, { error: `Product "${variant?.product.title || 'Unknown'}" is discontinued.` })
      }
      if (variant.stock < item.quantity) {
        const vName = variant.attributes ? (variant.attributes as any).name || 'Standard' : 'Standard'
        return sendJson(400, {
          error: `Item out of stock: "${variant.product.title} - ${vName}" (Requested: ${item.quantity}, Available: ${variant.stock})`
        })
      }
      const price = getEffectivePrice(variant, variant.product)
      subtotal += price * item.quantity
    }

    // 2. Validate Coupon and calculate discount
    let discount = 0
    let coupon = null
    if (data.couponCode) {
      coupon = await prisma.coupon.findUnique({
        where: { code: data.couponCode.toUpperCase() }
      })
      if (!coupon || !coupon.isActive) {
        return sendJson(400, { error: 'Invalid or inactive coupon code.' })
      }
      if (new Date() > coupon.expiry) {
        return sendJson(400, { error: 'Coupon has expired.' })
      }
      if (coupon.usedCount >= coupon.usageLimit) {
        return sendJson(400, { error: 'Coupon usage limit has been reached.' })
      }
      // Check user usage limit
      const userUsageCount = await prisma.couponUsage.count({
        where: { couponId: coupon.id, userId }
      })
      if (userUsageCount >= 1) {
        return sendJson(400, { error: 'You have already used this coupon code.' })
      }
      if (subtotal < coupon.minOrder) {
        return sendJson(400, {
          error: `Minimum order value of ₹${(coupon.minOrder / 100).toFixed(2)} is required to apply this coupon.`
        })
      }

      if (coupon.type === 'flat') {
        discount = coupon.value
      } else if (coupon.type === 'percent') {
        discount = Math.round(subtotal * (coupon.value / 100))
      }
      discount = Math.min(discount, subtotal)
    }

    // 3. Shipping fee calculations (free above $50.00, i.e., 5000 cents/paise, otherwise $5.00, i.e., 500 cents/paise)
    const shipping = subtotal >= 5000 ? 0 : 500
    const total = subtotal - discount + shipping

    // 4. Verify address exists
    const address = await prisma.address.findUnique({
      where: { id: data.addressId }
    })
    if (!address || address.userId !== userId) {
      return sendJson(400, { error: 'Invalid delivery address selected.' })
    }

    const addressSnapshot = {
      line1: address.line1,
      line2: address.line2,
      city: address.city,
      state: address.state,
      pincode: address.pincode,
      phone: address.phone
    }

    // 5. COD Payment Processing
    if (data.paymentMethod === 'cod') {
      const order = await prisma.$transaction(async (tx) => {
        // Atomic stock decrement with check
        for (const item of cart.items) {
          const variant = await tx.productVariant.findUnique({
            where: { id: item.productVariantId },
            include: { product: true }
          })
          if (!variant || variant.stock < item.quantity) {
            const vName = variant?.attributes ? (variant.attributes as any).name || 'Standard' : 'Standard'
            const title = variant?.product.title || 'Unknown Product'
            throw new Error(`Out of stock: "${title} - ${vName}"`)
          }

          const updateResult = await tx.productVariant.updateMany({
            where: {
              id: item.productVariantId,
              stock: { gte: item.quantity }
            },
            data: {
              stock: { decrement: item.quantity }
            }
          })

          if (updateResult.count === 0) {
            const vName = variant?.attributes ? (variant.attributes as any).name || 'Standard' : 'Standard'
            const title = variant?.product.title || 'Unknown Product'
            throw new Error(`Out of stock: "${title} - ${vName}"`)
          }
        }

        // Create Order + OrderItems + OrderStatusHistory
        const createdOrder = await tx.order.create({
          data: {
            userId,
            addressSnapshot,
            subtotal,
            discount,
            shipping,
            total,
            paymentStatus: PaymentStatus.pending,
            orderStatus: OrderStatus.placed,
            couponId: coupon?.id || null,
            items: {
              create: cart.items.map(item => ({
                productVariantId: item.productVariantId,
                titleSnapshot: item.productVariant.product.title,
                priceSnapshot: getEffectivePrice(item.productVariant, item.productVariant.product),
                quantity: item.quantity
              }))
            },
            statusHistory: {
              create: {
                status: OrderStatus.placed,
                notes: 'Order placed via Cash on Delivery'
              }
            },
            payments: {
              create: {
                status: PaymentStatus.pending,
                amount: total,
                method: 'Cash on Delivery'
              }
            }
          },
          include: {
            items: {
              include: {
                productVariant: {
                  include: {
                    product: true
                  }
                }
              }
            },
            statusHistory: true,
            user: {
              select: {
                name: true,
                email: true,
                phone: true
              }
            }
          }
        })

        // Apply coupon usage
        if (coupon) {
          await tx.coupon.update({
            where: { id: coupon.id },
            data: { usedCount: { increment: 1 } }
          })
          await tx.couponUsage.create({
            data: {
              couponId: coupon.id,
              userId,
              orderId: createdOrder.id
            }
          })
        }

        // Clear Cart
        await tx.cartItem.deleteMany({
          where: { cartId: cart.id }
        })

        return createdOrder
      })

      // Invalidate catalog cache for purchased products
      for (const item of cart.items) {
        CacheService.invalidateProduct(item.productVariant.product.slug)
      }

      if (order.user?.email) {
        BrevoService.sendOrderPlacedEmail(order.userId, order.user.email, order).catch(err => {
          console.error('[Checkout COD] Order placed notification error:', err)
        })
      }

      return sendJson(201, order)
    }

    // 6. Online Payment Processing (Razorpay stub)
    // TODO: Integrate Razorpay Node SDK in Phase 4D
    const razorpayOrderId = `rzp_order_${Math.floor(100000 + Math.random() * 900000)}`

    const order = await prisma.order.create({
      data: {
        userId,
        addressSnapshot,
        subtotal,
        discount,
        shipping,
        total,
        paymentStatus: PaymentStatus.pending,
        orderStatus: OrderStatus.placed,
        couponId: coupon?.id || null,
        items: {
          create: cart.items.map(item => ({
            productVariantId: item.productVariantId,
            titleSnapshot: item.productVariant.product.title,
            priceSnapshot: getEffectivePrice(item.productVariant, item.productVariant.product),
            quantity: item.quantity
          }))
        },
        statusHistory: {
          create: {
            status: OrderStatus.placed,
            notes: 'Order initiated via Online Payment'
          }
        },
        payments: {
          create: {
            razorpayOrderId,
            status: PaymentStatus.pending,
            amount: total,
            method: 'Online (Razorpay)'
          }
        }
      },
      include: {
        items: {
          include: {
            productVariant: {
              include: {
                product: true
              }
            }
          }
        },
        statusHistory: true,
        payments: true,
        user: {
          select: {
            name: true,
            email: true,
            phone: true
          }
        }
      }
    })

    // Invalidate catalog cache for purchased products
    for (const item of cart.items) {
      CacheService.invalidateProduct(item.productVariant.product.slug)
    }

    if (order.user?.email) {
      BrevoService.sendOrderPlacedEmail(order.userId, order.user.email, order).catch(err => {
        console.error('[Checkout Online] Order placed notification error:', err)
      })
    }

    return sendJson(201, {
      ...order,
      razorpayOrderId
    })

  } catch (error: any) {
    if (idempotencyKey) {
      idempotencyCache.del(idempotencyKey)
    }
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.issues[0]?.message || 'Validation error' })
    }
    console.error('[OrderCheckout] Error:', error)
    return res.status(400).json({ error: error.message || 'Internal Server Error' })
  }
})

/**
 * GET /api/orders
 * Retrieve current user's orders, sorted by newest first (cursor-paginated)
 */
router.get('/orders', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 50)
    const cursor = req.query.cursor as string | undefined

    const orders = await prisma.order.findMany({
      where: { userId: req.user!.id },
      take: limit + 1,
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      cursor: cursor ? { id: cursor } : undefined,
      skip: cursor ? 1 : 0,
      include: {
        items: {
          include: {
            productVariant: {
              include: {
                product: {
                  include: {
                    images: { orderBy: { position: 'asc' } }
                  }
                }
              }
            }
          }
        },
        statusHistory: {
          orderBy: { createdAt: 'desc' }
        },
        payments: true,
        shipments: true
      }
    })

    let nextCursor: string | null = null
    if (orders.length > limit) {
      nextCursor = orders[limit].id
      orders.pop()
    }

    return res.json({
      items: orders,
      orders, // fallback alias
      nextCursor,
      hasMore: !!nextCursor
    })
  } catch (error) {
    console.error('[GetOrders] Error fetching user orders:', error)
    return res.status(500).json({ error: 'Internal Server Error' })
  }
})

/**
 * GET /api/orders/:id
 * Retrieve single order detail (owner or admin)
 */
router.get('/orders/:id', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params
    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        user: { select: { name: true, email: true, phone: true } },
        items: {
          include: {
            productVariant: {
              include: {
                product: {
                  include: {
                    images: { orderBy: { position: 'asc' } }
                  }
                }
              }
            }
          }
        },
        statusHistory: {
          orderBy: { createdAt: 'desc' }
        },
        payments: true,
        shipments: true,
        returns: true
      }
    })

    if (!order) {
      return res.status(404).json({ error: 'Order not found.' })
    }

    // Role verification
    if (order.userId !== req.user!.id && req.user!.role === 'customer') {
      return res.status(403).json({ error: 'Access denied. You do not own this order.' })
    }

    return res.json(order)
  } catch (error) {
    console.error('[GetOrderDetail] Error:', error)
    return res.status(500).json({ error: 'Internal Server Error' })
  }
})

/**
 * POST /api/orders/:id/cancel
 * Cancel order, restocking items atomically (owner or admin)
 */
router.post('/orders/:id/cancel', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params
    const userId = req.user!.id

    const updatedOrder = await prisma.$transaction(async (tx) => {
      const order = await tx.order.findUnique({
        where: { id },
        include: { items: true }
      })

      if (!order) {
        throw new Error('Order not found.')
      }

      // Check owner permission unless admin
      if (order.userId !== userId && req.user!.role === 'customer') {
        throw new Error('Access denied. You do not own this order.')
      }

      // Check early status validity
      if (order.orderStatus !== OrderStatus.placed && order.orderStatus !== OrderStatus.confirmed) {
        throw new Error('This order cannot be cancelled at its current status.')
      }

      // 1. Restock items back
      for (const item of order.items) {
        await tx.productVariant.update({
          where: { id: item.productVariantId },
          data: {
            stock: { increment: item.quantity }
          }
        })
      }

      // 2. Create refund marker if payment was already captured
      if (order.paymentStatus === PaymentStatus.paid) {
        await tx.return.create({
          data: {
            orderId: id,
            reason: 'Order Cancelled',
            status: 'approved',
            refundAmount: order.total,
            refundStatus: 'pending'
          }
        })
      }

      // 3. Update order status to cancelled
      return tx.order.update({
        where: { id },
        data: {
          orderStatus: OrderStatus.cancelled,
          statusHistory: {
            create: {
              status: OrderStatus.cancelled,
              notes: req.user!.role === 'customer' ? 'Cancelled by customer' : 'Cancelled by administrator'
            }
          }
        },
        include: {
          items: {
            include: {
              productVariant: {
                include: {
                  product: {
                    include: {
                      images: { orderBy: { position: 'asc' } }
                    }
                  }
                }
              }
            }
          },
          statusHistory: {
            orderBy: { createdAt: 'desc' }
          },
          payments: true,
          shipments: true,
          returns: true,
          user: {
            select: {
              name: true,
              email: true,
              phone: true
            }
          }
        }
      })
    })

    // Invalidate catalog cache for restored products
    for (const item of updatedOrder.items) {
      if (item.productVariant?.product?.slug) {
        CacheService.invalidateProduct(item.productVariant.product.slug)
      }
    }

    if (updatedOrder.user?.email) {
      BrevoService.sendOrderCancelledEmail(updatedOrder.userId, updatedOrder.user.email, updatedOrder).catch(err => {
        console.error('[CancelOrder] Notification failed:', err)
      })
    }

    return res.json(updatedOrder)
  } catch (error: any) {
    console.error('[CancelOrder] Error:', error)
    return res.status(400).json({ error: error.message || 'Internal Server Error' })
  }
})

/**
 * POST /api/orders/:id/reorder
 * Re-adds all valid variants in an order back to user's cart
 */
router.post('/orders/:id/reorder', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params
    const userId = req.user!.id

    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            productVariant: {
              include: {
                product: true
              }
            }
          }
        }
      }
    })

    if (!order) {
      return res.status(404).json({ error: 'Order not found.' })
    }

    if (order.userId !== userId) {
      return res.status(403).json({ error: 'Access denied. You do not own this order.' })
    }

    let cart = await prisma.cart.findUnique({
      where: { userId }
    })
    if (!cart) {
      cart = await prisma.cart.create({ data: { userId } })
    }

    const skippedItems: any[] = []

    for (const item of order.items) {
      const variant = item.productVariant
      if (!variant || variant.product.status === 'archived' || variant.stock <= 0) {
        skippedItems.push({ title: item.titleSnapshot })
        continue
      }

      const existingCartItem = await prisma.cartItem.findUnique({
        where: {
          cartId_productVariantId: {
            cartId: cart.id,
            productVariantId: variant.id
          }
        }
      })

      if (existingCartItem) {
        const targetQty = Math.min(existingCartItem.quantity + item.quantity, variant.stock)
        await prisma.cartItem.update({
          where: { id: existingCartItem.id },
          data: { quantity: targetQty }
        })
      } else {
        const targetQty = Math.min(item.quantity, variant.stock)
        await prisma.cartItem.create({
          data: {
            cartId: cart.id,
            productVariantId: variant.id,
            quantity: targetQty
          }
        })
      }
    }

    const updatedCart = await getFullCart(userId)

    return res.json({
      cart: updatedCart,
      skippedItems
    })
  } catch (error) {
    console.error('[Reorder] Error re-adding order items to cart:', error)
    return res.status(500).json({ error: 'Internal Server Error' })
  }
})

/**
 * GET /api/admin/orders
 * Paginated list of all orders, filterable (admin only)
 */
router.get('/admin/orders', requireAuth, requireRole('super_owner', 'sub_admin'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 100)
    const cursor = req.query.cursor as string | undefined

    const status = req.query.status as string | undefined
    const date = req.query.date as string | undefined
    const search = req.query.search as string | undefined

    const where: any = {}

    if (status && status !== 'All') {
      where.orderStatus = status.toLowerCase().replace(/\s+/g, '_') as OrderStatus
    }

    if (date) {
      const dayStart = new Date(date)
      const dayEnd = new Date(date)
      dayEnd.setDate(dayEnd.getDate() + 1)
      where.createdAt = {
        gte: dayStart,
        lt: dayEnd
      }
    }

    if (search) {
      where.OR = [
        { id: { contains: search, mode: 'insensitive' } },
        { user: { name: { contains: search, mode: 'insensitive' } } },
        { user: { email: { contains: search, mode: 'insensitive' } } }
      ]
    }

    const orders = await prisma.order.findMany({
      where,
      take: limit + 1,
      cursor: cursor ? { id: cursor } : undefined,
      skip: cursor ? 1 : 0,
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      include: {
        user: { select: { name: true, email: true, phone: true } },
        items: {
          include: {
            productVariant: {
              include: {
                product: true
              }
            }
          }
        },
        statusHistory: {
          orderBy: { createdAt: 'desc' }
        },
        payments: true,
        shipments: true,
        returns: true
      }
    })

    const hasMore = orders.length > limit
    if (hasMore) {
      orders.pop()
    }
    const nextCursor = hasMore ? orders[orders.length - 1].id : null

    return res.json({
      items: orders,
      orders, // fallback alias
      nextCursor,
      hasMore
    })
  } catch (error) {
    console.error('[AdminGetOrders] Error:', error)
    return res.status(500).json({ error: 'Internal Server Error' })
  }
})

/**
 * PATCH /api/admin/orders/:id/status
 * Update status & log action (admin only)
 */
router.patch(
  '/admin/orders/:id/status',
  requireAuth,
  requireRole('super_owner', 'sub_admin'),
  logAction((req, resBody) => ({
    action: 'UPDATE_ORDER_STATUS',
    entityType: 'Order',
    entityId: req.params.id,
    metadata: { status: req.body.status, notes: req.body.notes }
  }))(async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params
      const data = updateStatusSchema.parse(req.body)

      const order = await prisma.order.findUnique({
        where: { id }
      })

      if (!order) {
        return res.status(404).json({ error: 'Order not found.' })
      }

      // Check transition validity
      if (!isValidTransition(order.orderStatus, data.status)) {
        return res.status(400).json({
          error: `Illegal state transition: Cannot change status from "${order.orderStatus}" to "${data.status}".`
        })
      }

      // If status transitions to 'packed', create a Shiprocket order and assign AWB.
      let shiprocketWarning: string | undefined = undefined

      if (data.status === OrderStatus.packed && order.orderStatus !== OrderStatus.packed) {
        // Query full order detail required for Shiprocket payloads
        const fullOrder = await prisma.order.findUnique({
          where: { id },
          include: {
            user: { select: { name: true, email: true, phone: true } },
            items: {
              include: {
                productVariant: true
              }
            },
            shipments: true
          }
        })

        if (fullOrder) {
          // Check if there is already an active shipment with AWB
          const activeShipment = fullOrder.shipments.find(s => s.awb !== null)
          if (!activeShipment) {
            try {
              const sOrder = await ShiprocketService.createShipmentOrder(fullOrder)
              const sAwb = await ShiprocketService.assignAwb(sOrder.shipmentId)

              // Clean up previous failed shipment records
              await prisma.shipment.deleteMany({
                where: { orderId: id, awb: null }
              })

              await prisma.shipment.create({
                data: {
                  orderId: id,
                  shiprocketOrderId: sOrder.shiprocketOrderId,
                  awb: sAwb.awb,
                  courier: sAwb.courier,
                  trackingUrl: `https://www.shiprocket.in/shipment-tracking/${sAwb.awb}`,
                  status: 'manifested'
                }
              })
            } catch (shpErr: any) {
              console.error('[Shiprocket Auto-Create Failed]:', shpErr)
              shiprocketWarning = `Order status updated to Packed, but Shiprocket registration failed: ${shpErr.message}. You can retry registration manually from the details panel.`
              
              // Register failed shipment marker
              await prisma.shipment.create({
                data: {
                  orderId: id,
                  status: 'failed'
                }
              })
            }
          }
        }
      }

      // Update state in database
      let updatedOrder: any
      if (data.status === OrderStatus.cancelled && order.orderStatus !== OrderStatus.cancelled) {
        updatedOrder = await prisma.$transaction(async (tx) => {
          // Restock items back
          const orderWithItems = await tx.order.findUnique({
            where: { id },
            include: { items: true }
          })
          if (orderWithItems) {
            for (const item of orderWithItems.items) {
              await tx.productVariant.update({
                where: { id: item.productVariantId },
                data: {
                  stock: { increment: item.quantity }
                }
              })
            }
          }

          // Create refund return requests if payment was paid
          if (order.paymentStatus === PaymentStatus.paid) {
            await tx.return.create({
              data: {
                orderId: id,
                reason: 'Order Cancelled by administrator',
                status: 'approved',
                refundAmount: order.total,
                refundStatus: 'pending'
              }
            })
          }

          return tx.order.update({
            where: { id },
            data: {
              orderStatus: OrderStatus.cancelled,
              statusHistory: {
                create: {
                  status: OrderStatus.cancelled,
                  notes: data.notes || 'Cancelled by administrator'
                }
              }
            },
            include: {
              user: { select: { name: true, email: true, phone: true } },
              items: {
                include: {
                  productVariant: {
                    include: {
                      product: true
                    }
                  }
                }
              },
              statusHistory: {
                orderBy: { createdAt: 'desc' }
              },
              payments: true,
              shipments: true,
              returns: true
            }
          })
        })

        // Invalidate cache for restored products
        for (const item of updatedOrder.items) {
          if (item.productVariant?.product?.slug) {
            CacheService.invalidateProduct(item.productVariant.product.slug)
          }
        }
      } else {
        const isDelivered = data.status === OrderStatus.delivered
        
        updatedOrder = await prisma.order.update({
          where: { id },
          data: {
            orderStatus: data.status,
            ...(isDelivered ? { paymentStatus: PaymentStatus.paid } : {}),
            statusHistory: {
              create: {
                status: data.status,
                notes: data.notes || `Status transitioned to ${data.status} by admin.`
              }
            }
          },
          include: {
            user: { select: { name: true, email: true, phone: true } },
            items: {
              include: {
                productVariant: {
                  include: {
                    product: true
                  }
                }
              }
            },
            statusHistory: {
              orderBy: { createdAt: 'desc' }
            },
            payments: true,
            shipments: true,
            returns: true
          }
        })

        if (isDelivered) {
          await prisma.payment.updateMany({
            where: { orderId: id, status: PaymentStatus.pending },
            data: { status: PaymentStatus.paid }
          })
          
          // Re-fetch to include the updated payments in the response
          updatedOrder = await prisma.order.findUnique({
            where: { id },
            include: {
              user: { select: { name: true, email: true, phone: true } },
              items: {
                include: {
                  productVariant: {
                    include: {
                      product: true
                    }
                  }
                }
              },
              statusHistory: {
                orderBy: { createdAt: 'desc' }
              },
              payments: true,
              shipments: true,
              returns: true
            }
          })
        }
      }

      // Trigger status transition notifications
      if (updatedOrder.user?.email) {
        const email = updatedOrder.user.email
        const uId = updatedOrder.userId
        
        if (data.status === OrderStatus.confirmed && order.orderStatus !== OrderStatus.confirmed) {
          BrevoService.sendOrderConfirmedEmail(uId, email, updatedOrder).catch(err => {
            console.error('[AdminStatus] Confirmed email failed:', err)
          })
        } else if (data.status === OrderStatus.shipped && order.orderStatus !== OrderStatus.shipped) {
          const shipment = updatedOrder.shipments?.[0]
          BrevoService.sendOrderShippedEmail(uId, email, updatedOrder, shipment).catch(err => {
            console.error('[AdminStatus] Shipped email failed:', err)
          })
        } else if (data.status === OrderStatus.delivered && order.orderStatus !== OrderStatus.delivered) {
          BrevoService.sendOrderDeliveredEmail(uId, email, updatedOrder).catch(err => {
            console.error('[AdminStatus] Delivered email failed:', err)
          })
        } else if (data.status === OrderStatus.cancelled && order.orderStatus !== OrderStatus.cancelled) {
          BrevoService.sendOrderCancelledEmail(uId, email, updatedOrder).catch(err => {
            console.error('[AdminStatus] Cancelled email failed:', err)
          })
        }
      }

      return res.json({ ...updatedOrder, warning: shiprocketWarning })
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.issues[0]?.message || 'Validation error' })
      }
      console.error('[AdminUpdateStatus] Error:', error)
      return res.status(500).json({ error: 'Internal Server Error' })
    }
  })
)

/**
 * POST /api/admin/orders/:id/retry-shipment
 * Manually retry Shiprocket shipment creation and assignment for an order in 'packed' (or later) status.
 */
router.post(
  '/admin/orders/:id/retry-shipment',
  requireAuth,
  requireRole('super_owner', 'sub_admin'),
  logAction((req, resBody) => ({
    action: 'RETRY_ORDER_SHIPMENT',
    entityType: 'Order',
    entityId: req.params.id,
    metadata: { orderId: req.params.id }
  }))(async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params

      const order = await prisma.order.findUnique({
        where: { id },
        include: {
          user: { select: { name: true, email: true, phone: true } },
          items: {
            include: {
              productVariant: true
            }
          },
          shipments: true
        }
      })

      if (!order) {
        return res.status(404).json({ error: 'Order not found.' })
      }

      // Allow retry if order status is packed or later (except cancelled)
      if (order.orderStatus === OrderStatus.cancelled || order.orderStatus === OrderStatus.placed || order.orderStatus === OrderStatus.confirmed) {
        return res.status(400).json({ error: 'Order must be in packed (ready to ship) or later status to register a shipment.' })
      }

      // Check if a shipment with an AWB already exists
      const activeShipment = order.shipments.find(s => s.awb !== null)
      if (activeShipment) {
        return res.status(400).json({ error: `A shipment record already exists with AWB ${activeShipment.awb}.` })
      }

      // Attempt to register with Shiprocket
      const sOrder = await ShiprocketService.createShipmentOrder(order)
      const sAwb = await ShiprocketService.assignAwb(sOrder.shipmentId)

      // Delete any existing failed shipments for this order to keep DB clean
      await prisma.shipment.deleteMany({
        where: { orderId: id, awb: null }
      })

      // Create new active shipment record
      const shipment = await prisma.shipment.create({
        data: {
          orderId: id,
          shiprocketOrderId: sOrder.shiprocketOrderId,
          awb: sAwb.awb,
          courier: sAwb.courier,
          trackingUrl: `https://www.shiprocket.in/shipment-tracking/${sAwb.awb}`,
          status: 'manifested'
        }
      })

      const updatedOrder = await prisma.order.findUnique({
        where: { id },
        include: {
          user: { select: { name: true, email: true, phone: true } },
          items: {
            include: {
              productVariant: {
                include: { product: true }
              }
            }
          },
          statusHistory: {
            orderBy: { createdAt: 'desc' }
          },
          payments: true,
          shipments: true,
          returns: true
        }
      })

      return res.json(updatedOrder)
    } catch (error: any) {
      console.error('[AdminRetryShipment] Error:', error)
      return res.status(400).json({ error: error.message || 'Failed to retry Shiprocket integration.' })
    }
  })
)

/**
 * GET /api/orders/:id/tracking
 * Fetch tracking details for the order. Gated by owner or admin.
 */
router.get('/orders/:id/tracking', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params
    const userId = req.user!.id

    const order = await prisma.order.findUnique({
      where: { id },
      include: { shipments: true }
    })

    if (!order) {
      return res.status(404).json({ error: 'Order not found.' })
    }

    if (order.userId !== userId && req.user!.role === 'customer') {
      return res.status(403).json({ error: 'Access denied. You do not own this order.' })
    }

    const shipment = order.shipments.find(s => s.awb !== null)
    if (!shipment || !shipment.awb) {
      return res.json({ tracking: null, status: 'Tracking not yet available' })
    }

    const trackingInfo = await ShiprocketService.trackShipment(shipment.awb)
    return res.json(trackingInfo)
  } catch (error) {
    console.error('[GetTracking] Error:', error)
    return res.status(500).json({ error: 'Internal Server Error' })
  }
})

/**
 * POST /api/shiprocket/webhook
 * Public endpoint to receive shipment state notifications and transition order status idempotently.
 */
router.post('/shiprocket/webhook', async (req, res) => {
  try {
    const webhookToken = process.env.SHIPROCKET_WEBHOOK_TOKEN
    if (webhookToken) {
      const headerToken = req.headers['x-webhook-token']
      if (headerToken !== webhookToken) {
        return res.status(401).json({ error: 'Unauthorized webhook request.' })
      }
    }

    const { awb, current_status } = req.body
    if (!awb || !current_status) {
      return res.status(400).json({ error: 'AWB and current_status are required in payload.' })
    }

    // Lookup Shipment
    const shipment = await prisma.shipment.findFirst({
      where: { awb },
      include: {
        order: {
          include: {
            statusHistory: true
          }
        }
      }
    })

    if (!shipment) {
      return res.status(404).json({ error: 'Associated shipment record not found.' })
    }

    const order = shipment.order
    const cleanStatus = current_status.toLowerCase().replace(/[\s_]+/g, '')

    let targetStatus: OrderStatus | null = null
    let note = `Shiprocket status updated to ${current_status}.`

    if (cleanStatus === 'shipped' || cleanStatus === 'intransit') {
      targetStatus = OrderStatus.shipped
    } else if (cleanStatus === 'outfordelivery') {
      targetStatus = OrderStatus.out_for_delivery
    } else if (cleanStatus === 'delivered') {
      targetStatus = OrderStatus.delivered
    }

    if (!targetStatus) {
      return res.json({ message: `Webhook received but ignored for status: ${current_status}` })
    }

    const statusPriority: Record<OrderStatus, number> = {
      placed: 0,
      confirmed: 1,
      packed: 2,
      shipped: 3,
      out_for_delivery: 4,
      delivered: 5,
      cancelled: 6
    }

    const currentPriority = statusPriority[order.orderStatus]
    const targetPriority = statusPriority[targetStatus]

    // Idempotency: Ignore if the order is already at or past the target status
    if (currentPriority >= targetPriority) {
      return res.json({ message: 'Webhook ignored. Order is already at a later status.' })
    }

    // Update Order & Shipment
    await prisma.$transaction(async (tx) => {
      const isDelivered = targetStatus === OrderStatus.delivered
      await tx.order.update({
        where: { id: order.id },
        data: {
          orderStatus: targetStatus!,
          ...(isDelivered ? { paymentStatus: PaymentStatus.paid } : {}),
          statusHistory: {
            create: {
              status: targetStatus!,
              notes: note
            }
          }
        }
      })

      if (isDelivered) {
        await tx.payment.updateMany({
          where: { orderId: order.id, status: PaymentStatus.pending },
          data: { status: PaymentStatus.paid }
        })
      }

      await tx.shipment.update({
        where: { id: shipment.id },
        data: {
          status: cleanStatus
        }
      })
    })

    // Trigger webhook status notifications
    const fullOrder = await prisma.order.findUnique({
      where: { id: order.id },
      include: {
        user: { select: { name: true, email: true } },
        shipments: true
      }
    })

    if (fullOrder && fullOrder.user?.email) {
      if (targetStatus === OrderStatus.shipped) {
        const activeShipment = fullOrder.shipments.find(s => s.awb === awb)
        BrevoService.sendOrderShippedEmail(fullOrder.userId, fullOrder.user.email, fullOrder, activeShipment).catch(err => {
          console.error('[Webhook] Shipped notification failed:', err)
        })
      } else if (targetStatus === OrderStatus.delivered) {
        BrevoService.sendOrderDeliveredEmail(fullOrder.userId, fullOrder.user.email, fullOrder).catch(err => {
          console.error('[Webhook] Delivered notification failed:', err)
        })
      }
    }

    return res.json({ message: `Status updated successfully to ${targetStatus}` })
  } catch (error) {
    console.error('[ShiprocketWebhook] Error:', error)
    return res.status(500).json({ error: 'Internal Server Error' })
  }
})

/**
 * POST /api/payments/webhook
 * Public endpoint to receive Razorpay payment state notifications.
 */
router.post('/payments/webhook', async (req, res) => {
  try {
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET || 'test_webhook_secret'
    const signature = req.headers['x-razorpay-signature'] as string

    if (!signature) {
      return res.status(400).json({ error: 'Missing x-razorpay-signature header' })
    }

    const shasum = crypto.createHmac('sha256', secret)
    shasum.update(typeof req.body === 'string' ? req.body : JSON.stringify(req.body))
    const digest = shasum.digest('hex')

    if (digest !== signature) {
      console.warn(`[RazorpayWebhook] Signature verification failed. Expected digest: ${digest}`)
      return res.status(400).json({ error: 'Signature verification failed' })
    }

    const { event, payload } = req.body
    if (!payload || !payload.payment || !payload.payment.entity) {
      return res.status(400).json({ error: 'Invalid webhook payload structure' })
    }

    const paymentEntity = payload.payment.entity
    const razorpayPaymentId = paymentEntity.id
    const razorpayOrderId = paymentEntity.order_id
    const amount = paymentEntity.amount
    const method = paymentEntity.method || 'Online'

    if (!razorpayOrderId) {
      return res.status(400).json({ error: 'razorpay_order_id is missing in payment entity' })
    }

    // Lookup order associated with the Razorpay Order ID
    const order = await prisma.order.findFirst({
      where: {
        payments: {
          some: {
            razorpayOrderId
          }
        }
      },
      include: {
        payments: true,
        user: {
          select: {
            name: true,
            email: true,
            phone: true
          }
        }
      }
    })

    if (!order) {
      return res.status(404).json({ error: `Order with Razorpay order ID ${razorpayOrderId} not found` })
    }

    if (event === 'payment.captured') {
      // Idempotency: Check if this payment ID has already been marked paid
      const matchedPaidPayment = order.payments.find(
        p => p.razorpayPaymentId === razorpayPaymentId && p.status === PaymentStatus.paid
      )
      if (matchedPaidPayment) {
        console.log(`[RazorpayWebhook] Webhook ignored. Payment ${razorpayPaymentId} already processed (idempotency).`)
        return res.json({ status: 'ignored', message: 'Payment already processed' })
      }

      await prisma.$transaction(async (tx) => {
        // Update payment record or create a new one
        const existingPendingPayment = order.payments.find(
          p => p.razorpayOrderId === razorpayOrderId && p.status === PaymentStatus.pending
        )

        if (existingPendingPayment) {
          await tx.payment.update({
            where: { id: existingPendingPayment.id },
            data: {
              razorpayPaymentId,
              status: PaymentStatus.paid,
              method
            }
          })
        } else {
          await tx.payment.create({
            data: {
              orderId: order.id,
              razorpayOrderId,
              razorpayPaymentId,
              status: PaymentStatus.paid,
              amount,
              method
            }
          })
        }

        // Transition order status to confirmed and paymentStatus to paid
        await tx.order.update({
          where: { id: order.id },
          data: {
            paymentStatus: PaymentStatus.paid,
            orderStatus: OrderStatus.confirmed,
            statusHistory: {
              create: {
                status: OrderStatus.confirmed,
                notes: `Payment captured via Razorpay webhook. Payment ID: ${razorpayPaymentId}`
              }
            }
          }
        })
      })

      // Send confirmed notification email asynchronously
      const updatedOrder = await prisma.order.findUnique({
        where: { id: order.id },
        include: {
          items: {
            include: {
              productVariant: {
                include: {
                  product: true
                }
              }
            }
          },
          user: {
            select: {
              name: true,
              email: true,
              phone: true
            }
          }
        }
      })

      if (updatedOrder && updatedOrder.user?.email) {
        BrevoService.sendOrderConfirmedEmail(updatedOrder.userId, updatedOrder.user.email, updatedOrder).catch(err => {
          console.error('[RazorpayWebhook] Confirmed email notification failed:', err)
        })
      }

      return res.json({ status: 'success', message: 'Payment captured and order confirmed successfully' })
    }

    if (event === 'payment.failed') {
      const existingPendingPayment = order.payments.find(
        p => p.razorpayOrderId === razorpayOrderId && p.status === PaymentStatus.pending
      )
      if (existingPendingPayment) {
        await prisma.payment.update({
          where: { id: existingPendingPayment.id },
          data: {
            status: PaymentStatus.failed
          }
        })
      }
      return res.json({ status: 'success', message: 'Payment status updated to failed' })
    }

    return res.json({ status: 'ignored', message: `Webhook received but ignored for event: ${event}` })
  } catch (error) {
    console.error('[RazorpayWebhook] Error:', error)
    return res.status(500).json({ error: 'Internal Server Error' })
  }
})

export default router
