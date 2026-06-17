import { Router, Response } from 'express'
import { z } from 'zod'
import { prisma } from '../lib/prisma'
import { requireAuth, AuthenticatedRequest } from '../middleware/auth.middleware'

const router = Router()

const addressSchema = z.object({
  line1: z.string().min(1, 'Address Line 1 is required'),
  line2: z.string().optional().nullable(),
  city: z.string().min(1, 'City is required'),
  state: z.string().min(1, 'State is required'),
  pincode: z.string().min(1, 'Pincode is required'),
  phone: z.string().min(1, 'Phone is required'),
  isDefault: z.boolean().default(false)
})

/**
 * GET /api/addresses
 * Get user addresses
 */
router.get('/addresses', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const addresses = await prisma.address.findMany({
      where: { userId: req.user!.id },
      orderBy: { createdAt: 'desc' }
    })
    return res.json(addresses)
  } catch (error) {
    console.error('[AddressRoutes] Error fetching addresses:', error)
    return res.status(500).json({ error: 'Internal Server Error' })
  }
})

/**
 * POST /api/addresses
 * Add a new address
 */
router.post('/addresses', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const data = addressSchema.parse(req.body)
    const userId = req.user!.id

    const newAddress = await prisma.$transaction(async (tx) => {
      if (data.isDefault) {
        // Clear other defaults
        await tx.address.updateMany({
          where: { userId, isDefault: true },
          data: { isDefault: false }
        })
      }

      return tx.address.create({
        data: {
          userId,
          line1: data.line1,
          line2: data.line2,
          city: data.city,
          state: data.state,
          pincode: data.pincode,
          phone: data.phone,
          isDefault: data.isDefault
        }
      })
    })

    return res.status(201).json(newAddress)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.issues[0]?.message || 'Validation error' })
    }
    console.error('[AddressRoutes] Error creating address:', error)
    return res.status(500).json({ error: 'Internal Server Error' })
  }
})

export default router
