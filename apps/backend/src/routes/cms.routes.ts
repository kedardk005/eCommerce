import { Router, Response } from 'express'
import { z } from 'zod'
import { prisma } from '../lib/prisma'
import { requireAuth, requireRole, AuthenticatedRequest } from '../middleware/auth.middleware'
import { logAction } from '../middleware/activityLog.middleware'
import { CacheService } from '../services/cache.service'

const router = Router()

const cmsUpdateSchema = z.object({
  title: z.string().min(1, 'Title is required').optional(),
  content: z.string().min(1, 'Content is required'),
  isActive: z.boolean().optional()
})

const getPageCacheKey = (slug: string) => `cms:page:${slug}`

/**
 * GET /api/pages/:slug
 * Public read of static pages (cached)
 */
router.get('/pages/:slug', async (req, res) => {
  const { slug } = req.params
  const cacheKey = getPageCacheKey(slug)
  const cached = CacheService.get(cacheKey)
  if (cached) {
    return res.json(cached)
  }

  try {
    const page = await prisma.staticPage.findUnique({
      where: { slug }
    })

    if (!page || !page.isActive) {
      return res.status(404).json({ error: 'Page not found.' })
    }

    CacheService.set(cacheKey, page, 24 * 60 * 60 * 1000) // 24 hours TTL
    return res.json(page)
  } catch (error) {
    console.error('[CMSRoutes] Error fetching page:', error)
    return res.status(500).json({ error: 'Internal Server Error' })
  }
})

/**
 * GET /api/admin/pages
 * List all static pages for CMS editor (admin-only)
 */
router.get(
  '/admin/pages',
  requireAuth,
  requireRole('super_owner', 'sub_admin'),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const pages = await prisma.staticPage.findMany({
        orderBy: { title: 'asc' }
      })
      return res.json(pages)
    } catch (error) {
      console.error('[CMSRoutes] Error listing admin pages:', error)
      return res.status(500).json({ error: 'Internal Server Error' })
    }
  }
)

/**
 * GET /api/admin/pages/:slug
 * Retrieve single page details (admin-only)
 */
router.get(
  '/admin/pages/:slug',
  requireAuth,
  requireRole('super_owner', 'sub_admin'),
  async (req: AuthenticatedRequest, res: Response) => {
    const { slug } = req.params
    try {
      const page = await prisma.staticPage.findUnique({
        where: { slug }
      })
      if (!page) {
        return res.status(404).json({ error: 'Page not found.' })
      }
      return res.json(page)
    } catch (error) {
      console.error('[CMSRoutes] Error fetching page detail:', error)
      return res.status(500).json({ error: 'Internal Server Error' })
    }
  }
)

/**
 * PUT /api/admin/pages/:slug
 * Update page content (super_owner only). Activity logged. Cache invalidated.
 */
router.put(
  '/admin/pages/:slug',
  requireAuth,
  requireRole('super_owner'),
  logAction((req, resBody) => ({
    action: 'UPDATE_CMS_PAGE',
    entityType: 'StaticPage',
    entityId: req.params.slug,
    metadata: { title: req.body.title }
  }))(async (req: AuthenticatedRequest, res: Response) => {
    const { slug } = req.params

    try {
      const data = cmsUpdateSchema.parse(req.body)

      const existing = await prisma.staticPage.findUnique({ where: { slug } })
      if (!existing) {
        return res.status(404).json({ error: 'Static page not found.' })
      }

      const updated = await prisma.staticPage.update({
        where: { slug },
        data: {
          title: data.title,
          content: data.content,
          isActive: data.isActive
        }
      })

      // Invalidate cache
      CacheService.del(getPageCacheKey(slug))

      return res.json(updated)
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.issues[0]?.message || 'Validation error' })
      }
      console.error('[CMSRoutes] Error updating static page:', error)
      return res.status(500).json({ error: 'Internal Server Error' })
    }
  })
)

export default router
