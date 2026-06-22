import { Router, Response } from 'express'
import { z } from 'zod'
import { prisma } from '../lib/prisma'
import { requireAuth, requireRole, AuthenticatedRequest } from '../middleware/auth.middleware'

const router = Router()

const contactMessageSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email address'),
  subject: z.string().min(1, 'Subject is required'),
  message: z.string().min(1, 'Message is required')
})

/**
 * POST /api/contact
 * Public endpoint to submit a contact message.
 */
router.post('/contact', async (req, res) => {
  try {
    const data = contactMessageSchema.parse(req.body)

    const message = await prisma.contactMessage.create({
      data: {
        name: data.name,
        email: data.email,
        subject: data.subject,
        message: data.message
      }
    })

    return res.status(201).json(message)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.issues[0]?.message || 'Validation error' })
    }
    console.error('[ContactRoutes] Error saving contact message:', error)
    return res.status(500).json({ error: 'Internal Server Error' })
  }
})

/**
 * GET /api/admin/contact-messages
 * Get contact messages for admin (super_owner or sub_admin)
 */
router.get(
  '/admin/contact-messages',
  requireAuth,
  requireRole('super_owner', 'sub_admin'),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const messages = await prisma.contactMessage.findMany({
        orderBy: { createdAt: 'desc' }
      })
      return res.json(messages)
    } catch (error) {
      console.error('[ContactRoutes] Error fetching contact messages:', error)
      return res.status(500).json({ error: 'Internal Server Error' })
    }
  }
)

/**
 * DELETE /api/admin/contact-messages/:id
 * Delete a contact message (super_owner or sub_admin)
 */
router.delete(
  '/admin/contact-messages/:id',
  requireAuth,
  requireRole('super_owner', 'sub_admin'),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params
      await prisma.contactMessage.delete({
        where: { id }
      })
      return res.json({ success: true, message: 'Message deleted successfully.' })
    } catch (error) {
      console.error('[ContactRoutes] Error deleting contact message:', error)
      return res.status(500).json({ error: 'Internal Server Error' })
    }
  }
)

export default router
