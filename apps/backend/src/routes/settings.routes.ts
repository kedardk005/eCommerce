import { Router, Response } from 'express'
import { z } from 'zod'
import { prisma } from '../lib/prisma'
import { requireAuth, requireRole, AuthenticatedRequest } from '../middleware/auth.middleware'
import { logAction } from '../middleware/activityLog.middleware'
import { CacheService } from '../services/cache.service'

const router = Router()

const settingsUpdateSchema = z.object({
  storeName: z.string().min(1, 'Store name is required').optional(),
  supportContact: z.string().email('Invalid email address').optional(),
  currency: z.string().min(1, 'Currency is required').optional(),
  lowStockThreshold: z.number().int().nonnegative('Stock threshold must be non-negative').optional(),
  codToggle: z.boolean().optional(),
  onlineToggle: z.boolean().optional()
})

// Helper to retrieve single Settings row
async function getOrCreateSettings() {
  let settings = await prisma.settings.findUnique({
    where: { id: 'global' }
  })
  if (!settings) {
    settings = await prisma.settings.create({
      data: {
        id: 'global',
        storeName: 'Toy Cabin',
        supportContact: 'support@toycabin.com',
        currency: 'INR',
        lowStockThreshold: 10,
        codToggle: true,
        onlineToggle: true
      }
    })
  }
  return settings
}

/**
 * GET /api/settings
 * Public config read (cached)
 */
router.get('/settings', async (req, res) => {
  const cacheKey = 'settings:global'
  const cached = CacheService.get(cacheKey)
  if (cached) {
    return res.json(cached)
  }

  try {
    const settings = await getOrCreateSettings()
    CacheService.set(cacheKey, settings, 60 * 60 * 1000) // 1 hour TTL
    return res.json(settings)
  } catch (error) {
    console.error('[SettingsRoutes] Error fetching settings:', error)
    return res.status(500).json({ error: 'Internal Server Error' })
  }
})

/**
 * GET /api/admin/settings
 * Get settings for admin dashboard (super_owner only)
 */
router.get(
  '/admin/settings',
  requireAuth,
  requireRole('super_owner'),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const settings = await getOrCreateSettings()
      return res.json(settings)
    } catch (error) {
      console.error('[SettingsRoutes] Error fetching admin settings:', error)
      return res.status(500).json({ error: 'Internal Server Error' })
    }
  }
)

/**
 * PUT /api/admin/settings
 * Update settings (super_owner only). Activity logged. Cache invalidated.
 */
router.put(
  '/admin/settings',
  requireAuth,
  requireRole('super_owner'),
  logAction((req, resBody) => ({
    action: 'UPDATE_GLOBAL_SETTINGS',
    entityType: 'Settings',
    entityId: 'global',
    metadata: req.body
  }))(async (req: AuthenticatedRequest, res: Response) => {
    try {
      const data = settingsUpdateSchema.parse(req.body)

      await getOrCreateSettings() // Ensure row exists

      const updated = await prisma.settings.update({
        where: { id: 'global' },
        data
      })

      CacheService.del('settings:global')

      return res.json(updated)
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.issues[0]?.message || 'Validation error' })
      }
      console.error('[SettingsRoutes] Error updating global settings:', error)
      return res.status(500).json({ error: 'Internal Server Error' })
    }
  })
)

export default router
