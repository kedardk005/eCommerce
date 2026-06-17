import { Router, Response } from 'express'
import { z } from 'zod'
import { prisma } from '../lib/prisma'
import { requireAuth, requireRole, AuthenticatedRequest } from '../middleware/auth.middleware'
import { logAction } from '../middleware/activityLog.middleware'
import { CacheService } from '../services/cache.service'

const router = Router()

const bannerSchema = z.object({
  r2Key: z.string().min(1, 'r2Key is required'),
  url: z.string().url('Invalid banner URL'),
  link: z.string().optional().nullable(),
  position: z.number().int().nonnegative('Position must be non-negative').default(0),
  isActive: z.boolean().default(true)
})

const bannerUpdateSchema = z.object({
  r2Key: z.string().optional(),
  url: z.string().url().optional(),
  link: z.string().optional().nullable(),
  position: z.number().int().nonnegative().optional(),
  isActive: z.boolean().optional()
})

const bannerCacheKey = 'marketing:banners:list'

/**
 * GET /api/banners
 * Public read, active only, ordered by position (cached)
 */
router.get('/banners', async (req, res) => {
  const cached = CacheService.get(bannerCacheKey)
  if (cached) {
    return res.json(cached)
  }

  try {
    const banners = await prisma.banner.findMany({
      where: { isActive: true },
      orderBy: { position: 'asc' }
    })
    CacheService.set(bannerCacheKey, banners, 24 * 60 * 60 * 1000) // 24 hours TTL
    return res.json(banners)
  } catch (error) {
    console.error('[BannerRoutes] Error fetching banners:', error)
    return res.status(500).json({ error: 'Internal Server Error' })
  }
})

/**
 * GET /api/admin/banners
 * Admin list of all banners (sorted by position)
 */
router.get(
  '/admin/banners',
  requireAuth,
  requireRole('super_owner', 'sub_admin'),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const banners = await prisma.banner.findMany({
        orderBy: { position: 'asc' }
      })
      return res.json(banners)
    } catch (error) {
      console.error('[BannerRoutes] Error fetching admin banners:', error)
      return res.status(500).json({ error: 'Internal Server Error' })
    }
  }
)

/**
 * POST /api/admin/banners
 * Create banner (admin only). Activity logged. Cache invalidated.
 */
router.post(
  '/admin/banners',
  requireAuth,
  requireRole('super_owner', 'sub_admin'),
  logAction((req, resBody) => ({
    action: 'CREATE_BANNER',
    entityType: 'Banner',
    entityId: resBody.id,
    metadata: { url: req.body.url, position: req.body.position }
  }))(async (req: AuthenticatedRequest, res: Response) => {
    try {
      const data = bannerSchema.parse(req.body)

      const banner = await prisma.banner.create({
        data
      })

      CacheService.del(bannerCacheKey)

      return res.status(201).json(banner)
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.issues[0]?.message || 'Validation error' })
      }
      console.error('[BannerRoutes] Error creating banner:', error)
      return res.status(500).json({ error: 'Internal Server Error' })
    }
  })
)

/**
 * PUT /api/admin/banners/:id
 * Update banner (admin only). Activity logged. Cache invalidated.
 */
router.put(
  '/admin/banners/:id',
  requireAuth,
  requireRole('super_owner', 'sub_admin'),
  logAction((req, resBody) => ({
    action: 'UPDATE_BANNER',
    entityType: 'Banner',
    entityId: req.params.id,
    metadata: req.body
  }))(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params

    try {
      const data = bannerUpdateSchema.parse(req.body)

      const existing = await prisma.banner.findUnique({ where: { id } })
      if (!existing) {
        return res.status(404).json({ error: 'Banner not found.' })
      }

      const updated = await prisma.banner.update({
        where: { id },
        data
      })

      CacheService.del(bannerCacheKey)

      return res.json(updated)
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.issues[0]?.message || 'Validation error' })
      }
      console.error('[BannerRoutes] Error updating banner:', error)
      return res.status(500).json({ error: 'Internal Server Error' })
    }
  })
)

/**
 * DELETE /api/admin/banners/:id
 * Delete banner (admin only). Activity logged. Cache invalidated.
 */
router.delete(
  '/admin/banners/:id',
  requireAuth,
  requireRole('super_owner', 'sub_admin'),
  logAction((req, resBody) => ({
    action: 'DELETE_BANNER',
    entityType: 'Banner',
    entityId: req.params.id
  }))(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params

    try {
      const existing = await prisma.banner.findUnique({ where: { id } })
      if (!existing) {
        return res.status(404).json({ error: 'Banner not found.' })
      }

      await prisma.banner.delete({ where: { id } })

      CacheService.del(bannerCacheKey)

      return res.json({ status: 'success', message: 'Banner deleted successfully.' })
    } catch (error) {
      console.error('[BannerRoutes] Error deleting banner:', error)
      return res.status(500).json({ error: 'Internal Server Error' })
    }
  })
)

export default router
