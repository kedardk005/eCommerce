import { Router, Response } from 'express'
import { z } from 'zod'
import { prisma } from '../lib/prisma'
import { requireAuth, requireRole, AuthenticatedRequest } from '../middleware/auth.middleware'
import { logAction } from '../middleware/activityLog.middleware'

const router = Router()

const createCouponSchema = z.object({
  code: z.string().min(1, 'Code is required').trim(),
  type: z.enum(['flat', 'percent']),
  value: z.number().int().positive('Discount value must be positive'),
  minOrder: z.number().int().nonnegative('Minimum order must be non-negative').default(0),
  expiry: z.string().refine(val => new Date(val) > new Date(), {
    message: 'Expiry date must be in the future'
  }),
  usageLimit: z.number().int().positive('Usage limit must be positive').default(1),
  isActive: z.boolean().default(true)
}).refine(data => {
  if (data.type === 'percent') {
    return data.value >= 0 && data.value <= 100
  }
  return true;
}, {
  message: 'Percentage discount must be between 0 and 100',
  path: ['value']
})

const updateCouponSchema = z.object({
  code: z.string().min(1).trim().optional(),
  type: z.enum(['flat', 'percent']).optional(),
  value: z.number().int().positive().optional(),
  minOrder: z.number().int().nonnegative().optional(),
  expiry: z.string().refine(val => new Date(val) > new Date(), {
    message: 'Expiry date must be in the future'
  }).optional(),
  usageLimit: z.number().int().positive().optional(),
  isActive: z.boolean().optional()
})

/**
 * GET /api/admin/coupons
 * Paginated list of coupons with usage stats and search filter
 */
router.get(
  '/',
  requireAuth,
  requireRole('super_owner', 'sub_admin'),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const page = Math.max(parseInt(req.query.page as string) || 1, 1)
      const limit = Math.min(Math.max(parseInt(req.query.limit as string) || 20, 1), 100)
      const skip = (page - 1) * limit
      const search = req.query.search as string

      const where: any = {}
      if (search) {
        where.code = {
          contains: search.toUpperCase().trim(),
          mode: 'insensitive'
        }
      }

      const [coupons, total] = await Promise.all([
        prisma.coupon.findMany({
          where,
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
          include: {
            _count: {
              select: { couponUsages: true }
            }
          }
        }),
        prisma.coupon.count({ where })
      ])

      // Map the usage counts to a clean property format
      const formattedCoupons = coupons.map(c => ({
        id: c.id,
        code: c.code,
        type: c.type,
        value: c.value,
        minOrder: c.minOrder,
        expiry: c.expiry.toISOString(),
        usageLimit: c.usageLimit,
        usedCount: c.usedCount,
        actualUsageCount: c._count.couponUsages,
        isActive: c.isActive,
        createdAt: c.createdAt.toISOString(),
        updatedAt: c.updatedAt.toISOString()
      }))

      return res.json({
        coupons: formattedCoupons,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      })
    } catch (error) {
      console.error('[AdminCoupons] Error fetching coupons:', error)
      return res.status(500).json({ error: 'Internal Server Error' })
    }
  }
)

/**
 * POST /api/admin/coupons
 * Create a new coupon. Activity logged.
 */
router.post(
  '/',
  requireAuth,
  requireRole('super_owner', 'sub_admin'),
  logAction((req, resBody) => ({
    action: 'CREATE_COUPON',
    entityType: 'Marketing',
    entityId: resBody.id,
    metadata: { code: req.body.code?.toUpperCase() }
  }))(async (req: AuthenticatedRequest, res: Response) => {
    try {
      const data = createCouponSchema.parse(req.body)
      const uppercaseCode = data.code.toUpperCase()

      // Check code uniqueness
      const existing = await prisma.coupon.findUnique({
        where: { code: uppercaseCode }
      })
      if (existing) {
        return res.status(400).json({ error: 'A coupon with this code already exists.' })
      }

      const coupon = await prisma.coupon.create({
        data: {
          code: uppercaseCode,
          type: data.type,
          value: data.value,
          minOrder: data.minOrder,
          expiry: new Date(data.expiry),
          usageLimit: data.usageLimit,
          isActive: data.isActive
        }
      })

      return res.status(201).json(coupon)
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.issues[0]?.message || 'Validation error' })
      }
      console.error('[AdminCoupons] Error creating coupon:', error)
      return res.status(500).json({ error: 'Internal Server Error' })
    }
  })
)

/**
 * PUT /api/admin/coupons/:id
 * Update coupon. Activity logged.
 */
router.put(
  '/:id',
  requireAuth,
  requireRole('super_owner', 'sub_admin'),
  logAction((req, resBody) => ({
    action: 'UPDATE_COUPON',
    entityType: 'Marketing',
    entityId: req.params.id,
    metadata: { code: req.body.code?.toUpperCase() }
  }))(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params

    try {
      const data = updateCouponSchema.parse(req.body)

      const existingCoupon = await prisma.coupon.findUnique({
        where: { id }
      })
      if (!existingCoupon) {
        return res.status(404).json({ error: 'Coupon not found.' })
      }

      // If updating code, check uniqueness
      let uppercaseCode = existingCoupon.code
      if (data.code) {
        uppercaseCode = data.code.toUpperCase()
        if (uppercaseCode !== existingCoupon.code) {
          const codeConflict = await prisma.coupon.findUnique({
            where: { code: uppercaseCode }
          })
          if (codeConflict) {
            return res.status(400).json({ error: 'A coupon with this code already exists.' })
          }
        }
      }

      // Verify bounds if type or value changes
      const finalType = data.type || existingCoupon.type
      const finalValue = data.value !== undefined ? data.value : existingCoupon.value
      if (finalType === 'percent' && (finalValue < 0 || finalValue > 100)) {
        return res.status(400).json({ error: 'Percentage discount must be between 0 and 100' })
      }

      const updatedCoupon = await prisma.coupon.update({
        where: { id },
        data: {
          code: uppercaseCode,
          type: data.type,
          value: data.value,
          minOrder: data.minOrder,
          expiry: data.expiry ? new Date(data.expiry) : undefined,
          usageLimit: data.usageLimit,
          isActive: data.isActive
        }
      })

      return res.json(updatedCoupon)
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.issues[0]?.message || 'Validation error' })
      }
      console.error('[AdminCoupons] Error updating coupon:', error)
      return res.status(500).json({ error: 'Internal Server Error' })
    }
  })
)

/**
 * DELETE /api/admin/coupons/:id
 * Delete coupon. Activity logged.
 */
router.delete(
  '/:id',
  requireAuth,
  requireRole('super_owner', 'sub_admin'),
  logAction((req, resBody) => ({
    action: 'DELETE_COUPON',
    entityType: 'Marketing',
    entityId: req.params.id
  }))(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params

    try {
      const existing = await prisma.coupon.findUnique({
        where: { id }
      })
      if (!existing) {
        return res.status(404).json({ error: 'Coupon not found.' })
      }

      await prisma.coupon.delete({
        where: { id }
      })

      return res.json({
        status: 'success',
        message: 'Coupon deleted successfully.'
      })
    } catch (error) {
      console.error('[AdminCoupons] Error deleting coupon:', error)
      return res.status(500).json({ error: 'Internal Server Error' })
    }
  })
)

export default router
