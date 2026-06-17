import { Router, Response } from 'express'
import { z } from 'zod'
import { prisma } from '../lib/prisma'
import { requireAuth, requireRole, AuthenticatedRequest } from '../middleware/auth.middleware'
import { logAction } from '../middleware/activityLog.middleware'

const router = Router()

const campaignSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().min(1, 'Description is required'),
  discountValue: z.number().int().positive().nullable().optional(),
  couponId: z.string().nullable().optional(),
  bannerId: z.string().nullable().optional(),
  startDate: z.string().refine(val => !isNaN(Date.parse(val)), { message: 'Invalid start date' }),
  endDate: z.string().refine(val => !isNaN(Date.parse(val)), { message: 'Invalid end date' }),
  isActive: z.boolean().default(true)
})

const campaignUpdateSchema = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
  discountValue: z.number().int().positive().nullable().optional(),
  couponId: z.string().nullable().optional(),
  bannerId: z.string().nullable().optional(),
  startDate: z.string().refine(val => !isNaN(Date.parse(val)), { message: 'Invalid start date' }).optional(),
  endDate: z.string().refine(val => !isNaN(Date.parse(val)), { message: 'Invalid end date' }).optional(),
  isActive: z.boolean().optional()
})

/**
 * GET /api/admin/campaigns
 * Admin list of all campaigns (paginated)
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

      const [campaigns, total] = await Promise.all([
        prisma.campaign.findMany({
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit,
          include: {
            banner: true
          }
        }),
        prisma.campaign.count()
      ])

      return res.json({
        items: campaigns,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      })
    } catch (error) {
      console.error('[CampaignRoutes] Error fetching campaigns:', error)
      return res.status(500).json({ error: 'Internal Server Error' })
    }
  }
)

/**
 * POST /api/admin/campaigns
 * Create campaign. Activity logged.
 */
router.post(
  '/',
  requireAuth,
  requireRole('super_owner', 'sub_admin'),
  logAction((req, resBody) => ({
    action: 'CREATE_CAMPAIGN',
    entityType: 'Campaign',
    entityId: resBody.id,
    metadata: { title: req.body.title }
  }))(async (req: AuthenticatedRequest, res: Response) => {
    try {
      const data = campaignSchema.parse(req.body)

      if (data.couponId) {
        const coupon = await prisma.coupon.findUnique({ where: { id: data.couponId } })
        if (!coupon) return res.status(400).json({ error: 'Coupon not found' })
      }
      if (data.bannerId) {
        const banner = await prisma.banner.findUnique({ where: { id: data.bannerId } })
        if (!banner) return res.status(400).json({ error: 'Banner not found' })
      }

      const campaign = await prisma.campaign.create({
        data: {
          title: data.title,
          description: data.description,
          discountValue: data.discountValue ?? null,
          couponId: data.couponId ?? null,
          bannerId: data.bannerId ?? null,
          startDate: new Date(data.startDate),
          endDate: new Date(data.endDate),
          isActive: data.isActive,
          status: 'draft'
        }
      })

      return res.status(201).json(campaign)
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.issues[0]?.message || 'Validation error' })
      }
      console.error('[CampaignRoutes] Error creating campaign:', error)
      return res.status(500).json({ error: 'Internal Server Error' })
    }
  })
)

/**
 * PUT /api/admin/campaigns/:id
 * Update campaign. Activity logged.
 */
router.put(
  '/:id',
  requireAuth,
  requireRole('super_owner', 'sub_admin'),
  logAction((req, resBody) => ({
    action: 'UPDATE_CAMPAIGN',
    entityType: 'Campaign',
    entityId: req.params.id,
    metadata: req.body
  }))(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params

    try {
      const data = campaignUpdateSchema.parse(req.body)

      const existing = await prisma.campaign.findUnique({ where: { id } })
      if (!existing) return res.status(404).json({ error: 'Campaign not found' })

      if (existing.status === 'sent') {
        return res.status(400).json({ error: 'Sent campaigns cannot be updated.' })
      }

      if (data.couponId) {
        const coupon = await prisma.coupon.findUnique({ where: { id: data.couponId } })
        if (!coupon) return res.status(400).json({ error: 'Coupon not found' })
      }
      if (data.bannerId) {
        const banner = await prisma.banner.findUnique({ where: { id: data.bannerId } })
        if (!banner) return res.status(400).json({ error: 'Banner not found' })
      }

      const updateData: any = { ...data }
      if (data.startDate) updateData.startDate = new Date(data.startDate)
      if (data.endDate) updateData.endDate = new Date(data.endDate)

      const updated = await prisma.campaign.update({
        where: { id },
        data: updateData
      })

      return res.json(updated)
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.issues[0]?.message || 'Validation error' })
      }
      console.error('[CampaignRoutes] Error updating campaign:', error)
      return res.status(500).json({ error: 'Internal Server Error' })
    }
  })
)

/**
 * DELETE /api/admin/campaigns/:id
 * Delete campaign. Activity logged.
 */
router.delete(
  '/:id',
  requireAuth,
  requireRole('super_owner', 'sub_admin'),
  logAction((req, resBody) => ({
    action: 'DELETE_CAMPAIGN',
    entityType: 'Campaign',
    entityId: req.params.id
  }))(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params

    try {
      const existing = await prisma.campaign.findUnique({ where: { id } })
      if (!existing) return res.status(404).json({ error: 'Campaign not found' })

      await prisma.campaign.delete({ where: { id } })

      return res.json({ status: 'success', message: 'Campaign deleted successfully.' })
    } catch (error) {
      console.error('[CampaignRoutes] Error deleting campaign:', error)
      return res.status(500).json({ error: 'Internal Server Error' })
    }
  })
)

/**
 * POST /api/admin/campaigns/:id/send
 * Trigger campaign send. Sets status to 'sent' and sentAt to now. Deliberate stub. Activity logged.
 */
router.post(
  '/:id/send',
  requireAuth,
  requireRole('super_owner', 'sub_admin'),
  logAction((req, resBody) => ({
    action: 'SEND_CAMPAIGN',
    entityType: 'Campaign',
    entityId: req.params.id,
    metadata: { sentAt: new Date().toISOString() }
  }))(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params

    try {
      const existing = await prisma.campaign.findUnique({ where: { id } })
      if (!existing) return res.status(404).json({ error: 'Campaign not found' })

      if (existing.status === 'sent') {
        return res.status(400).json({ error: 'Campaign has already been sent.' })
      }

      const updated = await prisma.campaign.update({
        where: { id },
        data: {
          status: 'sent',
          sentAt: new Date()
        }
      })

      // STUB FOR REAL EMAIL/SMS BROADCASTS
      console.log(`[CampaignService] STUB SEND: Campaign "${existing.title}" simulated sending to customer directories.`)

      return res.json({
        status: 'success',
        message: 'Campaign sent successfully.',
        campaign: updated
      })
    } catch (error) {
      console.error('[CampaignRoutes] Error sending campaign:', error)
      return res.status(500).json({ error: 'Internal Server Error' })
    }
  })
)

export default router
