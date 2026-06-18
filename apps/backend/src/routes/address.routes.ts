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

/**
 * PUT /api/addresses/:id
 * Update an existing address
 */
router.put('/addresses/:id', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params
    const data = addressSchema.parse(req.body)
    const userId = req.user!.id

    const existing = await prisma.address.findUnique({ where: { id } })
    if (!existing || existing.userId !== userId) {
      return res.status(404).json({ error: 'Address not found.' })
    }

    const updated = await prisma.$transaction(async (tx) => {
      if (data.isDefault) {
        // Clear other defaults
        await tx.address.updateMany({
          where: { userId, isDefault: true, id: { not: id } },
          data: { isDefault: false }
        })
      }

      return tx.address.update({
        where: { id },
        data: {
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

    return res.json(updated)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.issues[0]?.message || 'Validation error' })
    }
    console.error('[AddressRoutes] Error updating address:', error)
    return res.status(500).json({ error: 'Internal Server Error' })
  }
})

/**
 * DELETE /api/addresses/:id
 * Delete an address
 */
router.delete('/addresses/:id', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params
    const userId = req.user!.id

    const existing = await prisma.address.findUnique({ where: { id } })
    if (!existing || existing.userId !== userId) {
      return res.status(404).json({ error: 'Address not found.' })
    }

    await prisma.address.delete({ where: { id } })

    // If deleted address was default, promote the most recent one
    if (existing.isDefault) {
      const nextDefault = await prisma.address.findFirst({
        where: { userId },
        orderBy: { createdAt: 'desc' }
      })
      if (nextDefault) {
        await prisma.address.update({
          where: { id: nextDefault.id },
          data: { isDefault: true }
        })
      }
    }

    return res.json({ status: 'success', message: 'Address deleted successfully.' })
  } catch (error) {
    console.error('[AddressRoutes] Error deleting address:', error)
    return res.status(500).json({ error: 'Internal Server Error' })
  }
})

export default router
