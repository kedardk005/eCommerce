import { Router, Response } from 'express'
import { z } from 'zod'
import { prisma } from '../lib/prisma'
import { requireAuth, AuthenticatedRequest } from '../middleware/auth.middleware'
import { OtpService } from '../services/otp.service'

const router = Router()

const updateProfileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').optional(),
  phone: z.string().min(10, 'Phone number must be at least 10 digits').optional()
})

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(6, 'New password must be at least 6 characters')
})

const notificationPreferenceSchema = z.object({
  email: z.boolean(),
  sms: z.boolean(),
  whatsapp: z.boolean()
})

/**
 * GET /api/profile
 * Get the current authenticated user's profile
 */
router.get('/profile', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        emailVerified: true,
        createdAt: true,
        updatedAt: true,
        notificationPreferences: true
      }
    })

    if (!user) {
      return res.status(404).json({ error: 'User not found.' })
    }

    return res.json(user)
  } catch (error) {
    console.error('[ProfileRoutes] Error fetching profile:', error)
    return res.status(500).json({ error: 'Internal Server Error' })
  }
})

/**
 * PATCH /api/profile
 * Update the current user's name and/or phone
 */
router.patch('/profile', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const data = updateProfileSchema.parse(req.body)

    if (!data.name && !data.phone) {
      return res.status(400).json({ error: 'At least one field (name or phone) must be provided.' })
    }

    const updated = await prisma.user.update({
      where: { id: req.user!.id },
      data: {
        name: data.name,
        phone: data.phone
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        emailVerified: true,
        createdAt: true,
        updatedAt: true
      }
    })

    return res.json(updated)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.issues[0]?.message || 'Validation error' })
    }
    console.error('[ProfileRoutes] Error updating profile:', error)
    return res.status(500).json({ error: 'Internal Server Error' })
  }
})

/**
 * PATCH /api/profile/password
 * Change the current user's password (requires current password)
 */
router.patch('/profile/password', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const data = changePasswordSchema.parse(req.body)

    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: { passwordHash: true }
    })

    if (!user) {
      return res.status(404).json({ error: 'User not found.' })
    }

    // Verify current password
    const isValid = await OtpService.verifyPassword(data.currentPassword, user.passwordHash)
    if (!isValid) {
      return res.status(400).json({ error: 'Current password is incorrect.' })
    }

    // Hash and save new password
    const newHash = await OtpService.hashPassword(data.newPassword)

    await prisma.user.update({
      where: { id: req.user!.id },
      data: { passwordHash: newHash }
    })

    return res.json({
      status: 'success',
      message: 'Password changed successfully.'
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.issues[0]?.message || 'Validation error' })
    }
    console.error('[ProfileRoutes] Error changing password:', error)
    return res.status(500).json({ error: 'Internal Server Error' })
  }
})

/**
 * GET /api/profile/notifications
 * Get the current user's notification preferences
 */
router.get('/profile/notifications', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id
    const prefs = await prisma.notificationPreference.findMany({
      where: { userId }
    })

    // Build a map of type -> isEnabled with defaults
    const prefMap: Record<string, boolean> = {
      email: true,
      sms: false,
      whatsapp: false
    }
    for (const p of prefs) {
      prefMap[p.type] = p.isEnabled
    }

    return res.json(prefMap)
  } catch (error) {
    console.error('[ProfileRoutes] Error fetching notification preferences:', error)
    return res.status(500).json({ error: 'Internal Server Error' })
  }
})

/**
 * PUT /api/profile/notifications
 * Update the current user's notification preferences
 */
router.put('/profile/notifications', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const data = notificationPreferenceSchema.parse(req.body)
    const userId = req.user!.id

    const types: Array<{ type: string; isEnabled: boolean }> = [
      { type: 'email', isEnabled: data.email },
      { type: 'sms', isEnabled: data.sms },
      { type: 'whatsapp', isEnabled: data.whatsapp }
    ]

    await prisma.$transaction(
      types.map(({ type, isEnabled }) =>
        prisma.notificationPreference.upsert({
          where: { userId_type: { userId, type } },
          update: { isEnabled },
          create: { userId, type, isEnabled }
        })
      )
    )

    return res.json({
      email: data.email,
      sms: data.sms,
      whatsapp: data.whatsapp
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.issues[0]?.message || 'Validation error' })
    }
    console.error('[ProfileRoutes] Error updating notification preferences:', error)
    return res.status(500).json({ error: 'Internal Server Error' })
  }
})

export default router
