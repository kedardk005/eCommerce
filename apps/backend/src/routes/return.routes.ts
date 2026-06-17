import { Router, Response } from 'express'
import { z } from 'zod'
import { prisma } from '../lib/prisma'
import { requireAuth, requireRole, AuthenticatedRequest, rateLimit } from '../middleware/auth.middleware'
import { logAction } from '../middleware/activityLog.middleware'
import { ReturnStatus, RefundStatus, OrderStatus } from '@prisma/client'
import { CacheService } from '../services/cache.service'
import { BrevoService } from '../services/brevo.service'

const router = Router()

// Helper: parse DB reason string to extract rejectReason and originalReason
function parseReason(reason: string) {
  const match = reason.match(/^\[Rejected: (.*?)\]\s*(.*)$/)
  if (match) {
    return {
      rejectReason: match[1],
      reason: match[2]
    }
  }
  return {
    rejectReason: undefined,
    reason: reason
  }
}

// Helper: map Return model to JSON response DTO
function mapReturnToDto(ret: any) {
  const parsed = parseReason(ret.reason)
  
  // Renders status string matching frontend expectation ('Requested' | 'Approved' | 'Rejected' | 'Refunded')
  let uiStatus: 'Requested' | 'Approved' | 'Rejected' | 'Refunded' = 'Requested'
  if (ret.status === ReturnStatus.approved) {
    if (ret.refundStatus === RefundStatus.processed) {
      uiStatus = 'Refunded'
    } else {
      uiStatus = 'Approved'
    }
  } else if (ret.status === ReturnStatus.rejected) {
    uiStatus = 'Rejected'
  }

  return {
    id: ret.id,
    orderId: ret.orderId,
    customerName: ret.order?.user?.name || 'Customer',
    customerEmail: ret.order?.user?.email || '',
    customerPhone: ret.order?.user?.phone || '',
    reason: parsed.reason,
    rejectReason: parsed.rejectReason,
    status: uiStatus,
    refundAmount: ret.refundAmount / 100, // convert to UI currency (dollars)
    refundStatus: ret.refundStatus,
    createdAt: ret.createdAt,
    date: new Date(ret.createdAt).toISOString().substring(0, 10),
    items: ret.items.map((item: any) => ({
      id: item.id,
      orderItemId: item.orderItemId,
      productTitle: item.orderItem?.titleSnapshot || 'Product',
      variantName: item.orderItem?.productVariant?.attributes?.name || item.orderItem?.productVariant?.name || 'Standard',
      quantity: item.quantity,
      price: item.orderItem?.priceSnapshot ? item.orderItem.priceSnapshot / 100 : 0
    }))
  }
}

// Zod validation schemas
const createReturnSchema = z.object({
  items: z.array(z.object({
    orderItemId: z.string().min(1, 'orderItemId is required'),
    quantity: z.number().int().positive('Quantity must be greater than 0'),
    reason: z.string().min(1, 'Reason is required')
  })).min(1, 'At least one item must be returned'),
  comments: z.string().optional()
})

const rejectReturnSchema = z.object({
  reason: z.string().min(1, 'Rejection reason is required')
})

const approveReturnSchema = z.object({
  notes: z.string().optional()
})

/**
 * -----------------------------------------------------------------------------
 * CUSTOMER ROUTES (requireAuth)
 * -----------------------------------------------------------------------------
 */

/**
 * POST /api/orders/:id/return
 * Create a new return request for a delivered order within the 7-day window.
 */
router.post('/orders/:id/return', requireAuth, rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 3,
  message: 'Too many return requests submitted. Please try again in 1 hour.'
}), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id: orderId } = req.params
    const userId = req.user!.id
    const data = createReturnSchema.parse(req.body)

    // 1. Fetch order details
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: {
          include: {
            productVariant: true
          }
        },
        statusHistory: {
          orderBy: { createdAt: 'desc' }
        }
      }
    })

    if (!order) {
      return res.status(404).json({ error: 'Order not found.' })
    }

    if (order.userId !== userId) {
      return res.status(403).json({ error: 'Access denied. You do not own this order.' })
    }

    // 2. Validate Order Status is 'delivered'
    if (order.orderStatus !== OrderStatus.delivered) {
      return res.status(400).json({ error: 'Returns are only allowed for delivered orders.' })
    }

    // 3. Validate Return Window (7 days)
    const deliveredHistory = order.statusHistory.find(h => h.status === OrderStatus.delivered)
    const deliveryTime = deliveredHistory ? new Date(deliveredHistory.createdAt).getTime() : new Date(order.updatedAt).getTime()
    const currentTime = Date.now()
    const sevenDaysInMs = 7 * 24 * 60 * 60 * 1000

    if (currentTime - deliveryTime > sevenDaysInMs) {
      return res.status(400).json({ error: 'The return window for this order has expired (7 days from delivery).' })
    }

    // 4. Validate items and quantities
    let computedRefundAmount = 0
    const returnItemsPayload: Array<{ orderItemId: string; quantity: number }> = []

    for (const item of data.items) {
      const orderItem = order.items.find(oi => oi.id === item.orderItemId)
      if (!orderItem) {
        return res.status(400).json({ error: `Item "${item.orderItemId}" does not belong to this order.` })
      }

      if (item.quantity > orderItem.quantity) {
        return res.status(400).json({
          error: `Cannot return quantity ${item.quantity} for "${orderItem.titleSnapshot}". Purchased quantity is ${orderItem.quantity}.`
        })
      }

      // Query database for existing returns (pending or approved) for this orderItem to prevent over-returning
      const existingReturns = await prisma.returnItem.findMany({
        where: {
          orderItemId: item.orderItemId,
          return: {
            status: { in: [ReturnStatus.pending, ReturnStatus.approved] }
          }
        }
      })

      const alreadyReturnedQuantity = existingReturns.reduce((sum, r) => sum + r.quantity, 0)
      if (item.quantity + alreadyReturnedQuantity > orderItem.quantity) {
        return res.status(400).json({
          error: `Cannot return quantity ${item.quantity} for "${orderItem.titleSnapshot}". Already returned/requested: ${alreadyReturnedQuantity} of ${orderItem.quantity}.`
        })
      }

      computedRefundAmount += orderItem.priceSnapshot * item.quantity
      returnItemsPayload.push({
        orderItemId: item.orderItemId,
        quantity: item.quantity
      })
    }

    // 5. Build combined reason string to fit standard model
    const combinedReason = data.items
      .map(item => {
        const orderItem = order.items.find(oi => oi.id === item.orderItemId)
        return `${orderItem?.titleSnapshot || 'Item'}: ${item.reason}`
      })
      .join('; ')
    
    const finalReason = data.comments ? `${combinedReason} (Comments: ${data.comments})` : combinedReason

    // 6. Create Return request in database
    const createdReturn = await prisma.$transaction(async (tx) => {
      return tx.return.create({
        data: {
          orderId,
          reason: finalReason,
          status: ReturnStatus.pending,
          refundAmount: computedRefundAmount,
          refundStatus: RefundStatus.pending,
          items: {
            create: returnItemsPayload.map(ri => ({
              orderItemId: ri.orderItemId,
              quantity: ri.quantity
            }))
          }
        },
        include: {
          items: {
            include: {
              orderItem: {
                include: {
                  productVariant: true
                }
              }
            }
          },
          order: {
            include: {
              user: { select: { name: true, email: true, phone: true } }
            }
          }
        }
      })
    })

    if (createdReturn.order?.user?.email) {
      BrevoService.sendReturnRequestedEmail(userId, createdReturn.order.user.email, createdReturn).catch(err => {
        console.error('[CreateReturn] Notification failed:', err)
      })
    }

    return res.status(201).json(mapReturnToDto(createdReturn))
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.issues[0]?.message || 'Validation error' })
    }
    console.error('[CreateReturn] Error:', error)
    return res.status(500).json({ error: 'Internal Server Error' })
  }
})

/**
 * GET /api/returns
 * Retrieve cursor-paginated return requests for the current user.
 */
router.get('/returns', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 100)
    const cursor = req.query.cursor as string | undefined
    const userId = req.user!.id

    const where = {
      order: {
        userId
      }
    }

    const returns = await prisma.return.findMany({
      where,
      take: limit + 1,
      cursor: cursor ? { id: cursor } : undefined,
      skip: cursor ? 1 : 0,
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      include: {
        items: {
          include: {
            orderItem: {
              include: {
                productVariant: true
              }
            }
          }
        },
        order: {
          include: {
            user: { select: { name: true, email: true, phone: true } }
          }
        }
      }
    })

    const hasMore = returns.length > limit
    if (hasMore) {
      returns.pop()
    }
    const nextCursor = hasMore ? returns[returns.length - 1].id : null

    const mapped = returns.map(mapReturnToDto)

    return res.json({
      items: mapped,
      returns: mapped, // fallback alias
      nextCursor,
      hasMore
    })
  } catch (error) {
    console.error('[GetReturns] Error:', error)
    return res.status(500).json({ error: 'Internal Server Error' })
  }
})

/**
 * GET /api/returns/:id
 * Retrieve details of a specific return request. Must belong to the user.
 */
router.get('/returns/:id', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params
    const userId = req.user!.id

    const ret = await prisma.return.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            orderItem: {
              include: {
                productVariant: true
              }
            }
          }
        },
        order: {
          include: {
            user: { select: { name: true, email: true, phone: true } }
          }
        }
      }
    })

    if (!ret) {
      return res.status(404).json({ error: 'Return request not found.' })
    }

    // Gated check: customer must own the order associated with the return
    if (ret.order.userId !== userId && req.user!.role === 'customer') {
      return res.status(403).json({ error: 'Access denied. You do not own this return request.' })
    }

    return res.json(mapReturnToDto(ret))
  } catch (error) {
    console.error('[GetReturnDetail] Error:', error)
    return res.status(500).json({ error: 'Internal Server Error' })
  }
})

/**
 * -----------------------------------------------------------------------------
 * ADMIN ROUTES (requireAuth + requireRole admin)
 * -----------------------------------------------------------------------------
 */

/**
 * GET /api/admin/returns
 * Retrieve paginated, filterable return requests directory.
 */
router.get(
  '/admin/returns',
  requireAuth,
  requireRole('super_owner', 'sub_admin'),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const limit = Math.min(parseInt(req.query.limit as string) || 20, 100)
      const cursor = req.query.cursor as string | undefined

      const status = req.query.status as string | undefined
      const date = req.query.date as string | undefined

      const where: any = {}

      if (status && status !== 'All') {
        const s = status.toLowerCase()
        if (s === 'requested' || s === 'pending') {
          where.status = ReturnStatus.pending
        } else if (s === 'approved') {
          where.status = ReturnStatus.approved
          where.refundStatus = { not: RefundStatus.processed }
        } else if (s === 'rejected') {
          where.status = ReturnStatus.rejected
        } else if (s === 'refunded') {
          where.status = ReturnStatus.approved
          where.refundStatus = RefundStatus.processed
        }
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

      const returns = await prisma.return.findMany({
        where,
        take: limit + 1,
        cursor: cursor ? { id: cursor } : undefined,
        skip: cursor ? 1 : 0,
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        include: {
          items: {
            include: {
              orderItem: {
                include: {
                  productVariant: true
                }
              }
            }
          },
          order: {
            include: {
              user: { select: { name: true, email: true, phone: true } }
            }
          }
        }
      })

      const hasMore = returns.length > limit
      if (hasMore) {
        returns.pop()
      }
      const nextCursor = hasMore ? returns[returns.length - 1].id : null

      const mapped = returns.map(mapReturnToDto)

      return res.json({
        items: mapped,
        returns: mapped, // fallback alias
        nextCursor,
        hasMore
      })
    } catch (error) {
      console.error('[AdminGetReturns] Error:', error)
      return res.status(500).json({ error: 'Internal Server Error' })
    }
  }
)

/**
 * PATCH /api/admin/returns/:id/approve
 * Set return status to approved.
 */
router.patch(
  '/admin/returns/:id/approve',
  requireAuth,
  requireRole('super_owner', 'sub_admin'),
  logAction((req, resBody) => ({
    action: 'APPROVE_RETURN',
    entityType: 'Return',
    entityId: req.params.id,
    metadata: { notes: req.body.notes }
  }))(async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params
      const data = approveReturnSchema.parse(req.body)

      const ret = await prisma.return.findUnique({
        where: { id }
      })

      if (!ret) {
        return res.status(404).json({ error: 'Return request not found.' })
      }

      if (ret.status !== ReturnStatus.pending) {
        return res.status(400).json({ error: `Cannot approve a return in "${ret.status}" status.` })
      }

      let updatedReason = ret.reason
      if (data.notes && data.notes.trim()) {
        updatedReason = `[Approved Note: ${data.notes.trim()}] ${ret.reason}`
      }

      const updated = await prisma.return.update({
        where: { id },
        data: {
          status: ReturnStatus.approved,
          reason: updatedReason
        },
        include: {
          items: {
            include: {
              orderItem: {
                include: {
                  productVariant: true
                }
              }
            }
          },
          order: {
            include: {
              user: { select: { name: true, email: true, phone: true } }
            }
          }
        }
      })

      if (updated.order?.user?.email) {
        BrevoService.sendReturnApprovedEmail(updated.order.userId, updated.order.user.email, updated).catch(err => {
          console.error('[ApproveReturn] Notification failed:', err)
        })
      }

      return res.json(mapReturnToDto(updated))
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.issues[0]?.message || 'Validation error' })
      }
      console.error('[AdminApproveReturn] Error:', error)
      return res.status(500).json({ error: 'Internal Server Error' })
    }
  })
)

/**
 * PATCH /api/admin/returns/:id/reject
 * Set return status to rejected (requires reason).
 */
router.patch(
  '/admin/returns/:id/reject',
  requireAuth,
  requireRole('super_owner', 'sub_admin'),
  logAction((req, resBody) => ({
    action: 'REJECT_RETURN',
    entityType: 'Return',
    entityId: req.params.id,
    metadata: { reason: req.body.reason }
  }))(async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params
      const data = rejectReturnSchema.parse(req.body)

      const ret = await prisma.return.findUnique({
        where: { id }
      })

      if (!ret) {
        return res.status(404).json({ error: 'Return request not found.' })
      }

      if (ret.status !== ReturnStatus.pending) {
        return res.status(400).json({ error: `Cannot reject a return in "${ret.status}" status.` })
      }

      // Prefix the rejection reason into Return.reason field
      const updatedReason = `[Rejected: ${data.reason.trim()}] ${ret.reason}`

      const updated = await prisma.return.update({
        where: { id },
        data: {
          status: ReturnStatus.rejected,
          reason: updatedReason
        },
        include: {
          items: {
            include: {
              orderItem: {
                include: {
                  productVariant: true
                }
              }
            }
          },
          order: {
            include: {
              user: { select: { name: true, email: true, phone: true } }
            }
          }
        }
      })

      if (updated.order?.user?.email) {
        BrevoService.sendReturnRejectedEmail(updated.order.userId, updated.order.user.email, updated, data.reason).catch(err => {
          console.error('[RejectReturn] Notification failed:', err)
        })
      }

      return res.json(mapReturnToDto(updated))
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.issues[0]?.message || 'Validation error' })
      }
      console.error('[AdminRejectReturn] Error:', error)
      return res.status(500).json({ error: 'Internal Server Error' })
    }
  })
)

/**
 * POST /api/admin/returns/:id/refund
 * Process refund: restock variant inventory and mark refund status as processed.
 */
router.post(
  '/admin/returns/:id/refund',
  requireAuth,
  requireRole('super_owner', 'sub_admin'),
  logAction((req, resBody) => ({
    action: 'PROCESS_RETURN_REFUND',
    entityType: 'Return',
    entityId: req.params.id,
    metadata: { refundAmount: resBody.refundAmount }
  }))(async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params

      const updatedReturn = await prisma.$transaction(async (tx) => {
        // 1. Fetch return record with items
        const ret = await tx.return.findUnique({
          where: { id },
          include: {
            items: {
              include: {
                orderItem: {
                  include: {
                    productVariant: {
                      include: {
                        product: true
                      }
                    }
                  }
                }
              }
            }
          }
        })

        if (!ret) {
          throw new Error('Return request not found.')
        }

        // 2. Validate return status is approved and not already refunded
        if (ret.status !== ReturnStatus.approved) {
          throw new Error('Return request must be in "approved" status before issuing a refund.')
        }

        if (ret.refundStatus === RefundStatus.processed) {
          throw new Error('Refund has already been processed for this return request.')
        }

        // 3. Atomically restock returned quantities to variant stock level
        for (const item of ret.items) {
          await tx.productVariant.update({
            where: { id: item.orderItem.productVariantId },
            data: {
              stock: { increment: item.quantity }
            }
          })
        }

        // 4. Mark refund status as processed
        return tx.return.update({
          where: { id },
          data: {
            refundStatus: RefundStatus.processed
          },
          include: {
            items: {
              include: {
                orderItem: {
                  include: {
                    productVariant: {
                      include: {
                        product: true
                      }
                    }
                  }
                }
              }
            },
            order: {
              include: {
                user: { select: { name: true, email: true, phone: true } }
              }
            }
          }
        })
      })

      // 5. Evict items from product details cache after successful restocking transaction
      for (const item of updatedReturn.items) {
        const slug = item.orderItem?.productVariant?.product?.slug
        if (slug) {
          CacheService.invalidateProduct(slug)
        }
      }

      if (updatedReturn.order?.user?.email) {
        BrevoService.sendReturnRefundedEmail(updatedReturn.order.userId, updatedReturn.order.user.email, updatedReturn).catch(err => {
          console.error('[ProcessRefund] Notification failed:', err)
        })
      }

      return res.json(mapReturnToDto(updatedReturn))
    } catch (error: any) {
      console.error('[AdminProcessRefund] Error:', error)
      return res.status(400).json({ error: error.message || 'Failed to process refund.' })
    }
  })
)

export default router
