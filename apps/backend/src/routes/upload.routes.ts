import { Router, Response } from 'express'
import { z } from 'zod'
import crypto from 'crypto'
import { requireAuth, requireRole, AuthenticatedRequest } from '../middleware/auth.middleware'
import { R2Service } from '../services/r2.service'

const router = Router()

// Define supported folders structure per toy-ecommerce-backend.md
const allowedFolders = ['products', 'banners', 'categories', 'invoices', 'tickets'] as const

const presignUploadSchema = z.object({
  fileName: z.string().min(1, 'fileName is required'),
  contentType: z.string().min(1, 'contentType is required'),
  folder: z.enum(allowedFolders, {
    message: `folder must be one of: ${allowedFolders.join(', ')}`
  })
})

/**
 * POST /api/uploads/presign
 * Restrict to admin roles (super_owner and sub_admin) since uploads belong to admin CRUD flows.
 */
router.post(
  '/presign',
  requireAuth,
  requireRole('super_owner', 'sub_admin'),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const data = presignUploadSchema.parse(req.body)

      // Construct a safe, clean unique key path
      const uniqueId = crypto.randomUUID()
      // Clean up filename from any unsafe characters
      const sanitizedFileName = data.fileName.replace(/[^a-zA-Z0-9.-]/g, '_')
      const key = `${data.folder}/${uniqueId}-${sanitizedFileName}`

      // Get signed PUT URL for frontend client direct uploading
      const uploadUrl = await R2Service.getPresignedUploadUrl(key, data.contentType)
      const publicUrl = R2Service.getPublicUrl(key)

      return res.json({
        uploadUrl,
        publicUrl,
        key
      })
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.issues[0]?.message || 'Validation error' })
      }
      console.error('[UploadRoutes] Error generating presigned URL:', error)
      return res.status(500).json({ error: 'Internal Server Error' })
    }
  }
)

export default router
