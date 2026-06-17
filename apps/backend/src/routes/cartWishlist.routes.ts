import { Router, Response } from 'express'
import { z } from 'zod'
import { prisma } from '../lib/prisma'
import { requireAuth, AuthenticatedRequest } from '../middleware/auth.middleware'

const router = Router()

// Zod schemas for cart and wishlist inputs
const cartItemAddSchema = z.object({
  productId: z.string().min(1, 'productId is required'),
  variantId: z.string().min(1, 'variantId is required'),
  quantity: z.number().int().positive('Quantity must be a positive integer')
})

const cartItemUpdateSchema = z.object({
  quantity: z.number().int().positive('Quantity must be a positive integer')
})

const wishlistAddSchema = z.object({
  productId: z.string().min(1, 'productId is required'),
  variantId: z.string().optional()
})

const applyCouponSchema = z.object({
  code: z.string().min(1, 'Coupon code is required')
})

// Helper to calculate effective price in paise/cents
function getEffectivePrice(variant: any, product: any): number {
  return variant.priceOverride ?? product.discountPrice ?? product.basePrice
}

// Helper to query the cart with standard includes
async function getFullCart(userId: string) {
  let cart = await prisma.cart.findUnique({
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

  if (!cart) {
    cart = await prisma.cart.create({
      data: { userId },
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

  return cart
}

// Helper to query wishlist with standard includes
async function getFullWishlist(userId: string) {
  let wishlist = await prisma.wishlist.findUnique({
    where: { userId },
    include: {
      items: {
        orderBy: { createdAt: 'asc' },
        include: {
          product: {
            include: {
              images: { orderBy: { position: 'asc' } },
              variants: true
            }
          },
          productVariant: true
        }
      }
    }
  })

  if (!wishlist) {
    wishlist = await prisma.wishlist.create({
      data: { userId },
      include: {
        items: {
          orderBy: { createdAt: 'asc' },
          include: {
            product: {
              include: {
                images: { orderBy: { position: 'asc' } },
                variants: true
              }
            },
            productVariant: true
          }
        }
      }
    })
  }

  return wishlist
}

/**
 * GET /api/cart
 * Fetch current user's cart with live prices and current stock
 */
router.get('/cart', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const cart = await getFullCart(req.user!.id)
    return res.json(cart)
  } catch (error) {
    console.error('[CartRoutes] Error fetching cart:', error)
    return res.status(500).json({ error: 'Internal Server Error' })
  }
})

/**
 * POST /api/cart/items
 * Add an item to the cart, or increment quantity if it already exists
 */
router.post('/cart/items', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const data = cartItemAddSchema.parse(req.body)

    const variant = await prisma.productVariant.findUnique({
      where: { id: data.variantId },
      include: { product: true }
    })

    if (!variant || variant.productId !== data.productId) {
      return res.status(400).json({ error: 'Product variant not found.' })
    }

    if (variant.product.status === 'archived') {
      return res.status(400).json({ error: 'Product is archived and cannot be bought.' })
    }

    const cart = await getFullCart(req.user!.id)

    // Check if item already exists in cart
    const existingItem = cart.items.find(item => item.productVariantId === data.variantId)

    if (existingItem) {
      const newQuantity = existingItem.quantity + data.quantity
      if (newQuantity > variant.stock) {
        return res.status(400).json({ error: `Requested quantity exceeds available stock. Current stock is ${variant.stock}.` })
      }

      await prisma.cartItem.update({
        where: { id: existingItem.id },
        data: { quantity: newQuantity }
      })
    } else {
      if (data.quantity > variant.stock) {
        return res.status(400).json({ error: `Requested quantity exceeds available stock. Current stock is ${variant.stock}.` })
      }

      await prisma.cartItem.create({
        data: {
          cartId: cart.id,
          productVariantId: data.variantId,
          quantity: data.quantity
        }
      })
    }

    const updatedCart = await getFullCart(req.user!.id)
    return res.json(updatedCart)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.issues[0]?.message || 'Validation error' })
    }
    console.error('[CartRoutes] Error adding to cart:', error)
    return res.status(500).json({ error: 'Internal Server Error' })
  }
})

/**
 * PATCH /api/cart/items/:id
 * Update quantity of an item in the cart
 */
router.patch('/cart/items/:id', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  const cartItemId = req.params.id

  try {
    const data = cartItemUpdateSchema.parse(req.body)

    const cartItem = await prisma.cartItem.findUnique({
      where: { id: cartItemId },
      include: {
        productVariant: true,
        cart: true
      }
    })

    if (!cartItem || cartItem.cart.userId !== req.user!.id) {
      return res.status(404).json({ error: 'Cart item not found.' })
    }

    // Verify stock availability
    if (data.quantity > cartItem.productVariant.stock) {
      return res.status(400).json({ error: `Requested quantity exceeds available stock. Current stock is ${cartItem.productVariant.stock}.` })
    }

    await prisma.cartItem.update({
      where: { id: cartItemId },
      data: { quantity: data.quantity }
    })

    const updatedCart = await getFullCart(req.user!.id)
    return res.json(updatedCart)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.issues[0]?.message || 'Validation error' })
    }
    console.error('[CartRoutes] Error updating cart item:', error)
    return res.status(500).json({ error: 'Internal Server Error' })
  }
})

/**
 * DELETE /api/cart/items/:id
 * Remove an item from the cart
 */
router.delete('/cart/items/:id', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  const cartItemId = req.params.id

  try {
    const cartItem = await prisma.cartItem.findUnique({
      where: { id: cartItemId },
      include: { cart: true }
    })

    if (!cartItem || cartItem.cart.userId !== req.user!.id) {
      return res.status(404).json({ error: 'Cart item not found.' })
    }

    await prisma.cartItem.delete({
      where: { id: cartItemId }
    })

    const updatedCart = await getFullCart(req.user!.id)
    return res.json(updatedCart)
  } catch (error) {
    console.error('[CartRoutes] Error deleting cart item:', error)
    return res.status(500).json({ error: 'Internal Server Error' })
  }
})

/**
 * DELETE /api/cart
 * Clear the entire shopping cart for the user
 */
router.delete('/cart', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const cart = await getFullCart(req.user!.id)

    await prisma.cartItem.deleteMany({
      where: { cartId: cart.id }
    })

    const updatedCart = await getFullCart(req.user!.id)
    return res.json(updatedCart)
  } catch (error) {
    console.error('[CartRoutes] Error clearing cart:', error)
    return res.status(500).json({ error: 'Internal Server Error' })
  }
})

/**
 * POST /api/cart/apply-coupon
 * Apply a coupon code, returning coupon details and calculation
 */
router.post('/cart/apply-coupon', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const data = applyCouponSchema.parse(req.body)

    const coupon = await prisma.coupon.findUnique({
      where: { code: data.code.toUpperCase() }
    })

    if (!coupon || !coupon.isActive) {
      return res.status(400).json({ error: 'Invalid or inactive coupon code.' })
    }

    if (new Date() > coupon.expiry) {
      return res.status(400).json({ error: 'Coupon has expired.' })
    }

    if (coupon.usedCount >= coupon.usageLimit) {
      return res.status(400).json({ error: 'Coupon usage limit has been reached.' })
    }

    // Verify user usage count limit
    const userUsageCount = await prisma.couponUsage.count({
      where: {
        couponId: coupon.id,
        userId: req.user!.id
      }
    })

    // If usageLimit applies as a cap per user
    if (userUsageCount >= coupon.usageLimit) {
      return res.status(400).json({ error: 'You have already used this coupon code the maximum allowed number of times.' })
    }

    const cart = await getFullCart(req.user!.id)
    if (cart.items.length === 0) {
      return res.status(400).json({ error: 'Your cart is empty.' })
    }

    // Calculate subtotal
    const subtotal = cart.items.reduce((sum, item) => {
      const price = getEffectivePrice(item.productVariant, item.productVariant.product)
      return sum + price * item.quantity
    }, 0)

    if (subtotal < coupon.minOrder) {
      return res.status(400).json({
        error: `Minimum order value of $${(coupon.minOrder / 100).toFixed(2)} is required to apply this coupon. Current subtotal: $${(subtotal / 100).toFixed(2)}`
      })
    }

    // Calculate discount amount
    let discountAmount = 0
    if (coupon.type === 'flat') {
      discountAmount = coupon.value
    } else if (coupon.type === 'percent') {
      discountAmount = Math.round(subtotal * (coupon.value / 100))
    }

    discountAmount = Math.min(discountAmount, subtotal)

    return res.json({
      code: coupon.code,
      type: coupon.type,
      value: coupon.value,
      discountAmount: discountAmount / 100 // Return decimal dollars for customer app
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.issues[0]?.message || 'Validation error' })
    }
    console.error('[CartRoutes] Error applying coupon:', error)
    return res.status(500).json({ error: 'Internal Server Error' })
  }
})

/**
 * DELETE /api/cart/coupon
 * Remove coupon from cart
 */
router.delete('/cart/coupon', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  return res.json({ success: true, message: 'Coupon removed from cart.' })
})

/**
 * GET /api/wishlist
 * Fetch current user's wishlist items
 */
router.get('/wishlist', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const wishlist = await getFullWishlist(req.user!.id)
    return res.json(wishlist.items)
  } catch (error) {
    console.error('[WishlistRoutes] Error fetching wishlist:', error)
    return res.status(500).json({ error: 'Internal Server Error' })
  }
})

/**
 * POST /api/wishlist/items
 * Add an item to the wishlist
 */
router.post('/wishlist/items', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const data = wishlistAddSchema.parse(req.body)

    const product = await prisma.product.findUnique({
      where: { id: data.productId }
    })

    if (!product || product.status === 'archived') {
      return res.status(400).json({ error: 'Product not found or is archived.' })
    }

    if (data.variantId) {
      const variant = await prisma.productVariant.findUnique({
        where: { id: data.variantId }
      })
      if (!variant || variant.productId !== data.productId) {
        return res.status(400).json({ error: 'Product variant not found.' })
      }
    }

    const wishlist = await getFullWishlist(req.user!.id)

    // Check if already in wishlist
    const existingItem = wishlist.items.find(
      item => item.productId === data.productId && item.productVariantId === (data.variantId || null)
    )

    if (!existingItem) {
      await prisma.wishlistItem.create({
        data: {
          wishlistId: wishlist.id,
          productId: data.productId,
          productVariantId: data.variantId || null
        }
      })
    }

    const updatedWishlist = await getFullWishlist(req.user!.id)
    return res.json(updatedWishlist.items)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.issues[0]?.message || 'Validation error' })
    }
    console.error('[WishlistRoutes] Error adding to wishlist:', error)
    return res.status(500).json({ error: 'Internal Server Error' })
  }
})

/**
 * DELETE /api/wishlist/items/:id
 * Remove an item from the wishlist
 */
router.delete('/wishlist/items/:id', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  const wishlistItemId = req.params.id

  try {
    const wishlistItem = await prisma.wishlistItem.findUnique({
      where: { id: wishlistItemId },
      include: { wishlist: true }
    })

    if (!wishlistItem || wishlistItem.wishlist.userId !== req.user!.id) {
      return res.status(404).json({ error: 'Wishlist item not found.' })
    }

    await prisma.wishlistItem.delete({
      where: { id: wishlistItemId }
    })

    const updatedWishlist = await getFullWishlist(req.user!.id)
    return res.json(updatedWishlist.items)
  } catch (error) {
    console.error('[WishlistRoutes] Error deleting wishlist item:', error)
    return res.status(500).json({ error: 'Internal Server Error' })
  }
})

/**
 * POST /api/wishlist/items/:id/move-to-cart
 * Move a wishlist item to the cart in a database transaction
 */
router.post('/wishlist/items/:id/move-to-cart', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  const wishlistItemId = req.params.id

  try {
    const wishlistItem = await prisma.wishlistItem.findUnique({
      where: { id: wishlistItemId },
      include: {
        wishlist: true,
        product: {
          include: {
            variants: true
          }
        }
      }
    })

    if (!wishlistItem || wishlistItem.wishlist.userId !== req.user!.id) {
      return res.status(404).json({ error: 'Wishlist item not found.' })
    }

    // Resolve variant ID
    let variantId = wishlistItem.productVariantId
    if (!variantId) {
      if (wishlistItem.product.variants.length === 0) {
        return res.status(400).json({ error: 'Product has no variants available to add to cart.' })
      }
      variantId = wishlistItem.product.variants[0].id
    }

    const variant = await prisma.productVariant.findUnique({
      where: { id: variantId }
    })

    if (!variant) {
      return res.status(400).json({ error: 'Product variant not found.' })
    }

    if (variant.stock < 1) {
      return res.status(400).json({ error: 'Product variant is out of stock.' })
    }

    // Execute move-to-cart transactionally
    await prisma.$transaction(async (tx) => {
      // 1. Find or create Cart
      let cart = await tx.cart.findUnique({
        where: { userId: req.user!.id }
      })
      if (!cart) {
        cart = await tx.cart.create({
          data: { userId: req.user!.id }
        })
      }

      // 2. Check if variant is already in cart
      const existingCartItem = await tx.cartItem.findUnique({
        where: {
          cartId_productVariantId: {
            cartId: cart.id,
            productVariantId: variantId!
          }
        }
      })

      if (existingCartItem) {
        const newQuantity = existingCartItem.quantity + 1
        if (newQuantity > variant.stock) {
          throw new Error(`Cannot add to cart. Requested quantity exceeds stock. Available: ${variant.stock}.`)
        }
        await tx.cartItem.update({
          where: { id: existingCartItem.id },
          data: { quantity: newQuantity }
        })
      } else {
        await tx.cartItem.create({
          data: {
            cartId: cart.id,
            productVariantId: variantId!,
            quantity: 1
          }
        })
      }

      // 3. Delete wishlist item
      await tx.wishlistItem.delete({
        where: { id: wishlistItemId }
      })
    })

    const updatedCart = await getFullCart(req.user!.id)
    const updatedWishlist = await getFullWishlist(req.user!.id)

    return res.json({
      cart: updatedCart,
      wishlist: updatedWishlist.items
    })
  } catch (error: any) {
    console.error('[WishlistRoutes] Error moving item to cart:', error)
    return res.status(400).json({ error: error.message || 'Internal Server Error' })
  }
})

export default router
