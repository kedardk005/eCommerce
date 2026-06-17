import { Router, Request, Response } from 'express'
import { z } from 'zod'
import { prisma } from '../lib/prisma'
import { requireAuth, requireRole, AuthenticatedRequest } from '../middleware/auth.middleware'
import { logAction } from '../middleware/activityLog.middleware'
import crypto from 'crypto'
import { OtpService } from '../services/otp.service'
import { BrevoService } from '../services/brevo.service'
import { Role } from '@prisma/client'

const router = Router()

// Schema definitions
const inviteSchema = z.object({
  email: z.string().email('Invalid email address'),
  name: z.string().min(2, 'Name must be at least 2 characters'),
  role: z.enum(['sub_admin', 'super_owner']).default('sub_admin'),
  permissions: z.array(z.string()).default([])
})

const updateAccountSchema = z.object({
  role: z.enum(['sub_admin', 'super_owner']).optional(),
  isBlocked: z.boolean().optional(),
  permissions: z.array(z.string()).optional()
})

const setPasswordSchema = z.object({
  token: z.string().min(1, 'Token is required'),
  password: z.string().min(6, 'Password must be at least 6 characters long')
})

// GET /api/admin/accounts (super_owner only)
router.get('/', requireAuth, requireRole('super_owner'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const accounts = await prisma.user.findMany({
      where: {
        role: {
          in: ['sub_admin', 'super_owner']
        }
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        isBlocked: true,
        createdAt: true,
        updatedAt: true,
        adminPermissions: {
          select: {
            permission: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    const formatted = accounts.map(acc => ({
      ...acc,
      permissions: acc.adminPermissions.map(p => p.permission)
    }))

    return res.json({
      success: true,
      data: formatted
    })
  } catch (error) {
    console.error('Fetch staff accounts error:', error)
    return res.status(500).json({ error: 'Internal Server Error' })
  }
})

// POST /api/admin/accounts/invite (super_owner only)
router.post('/invite', requireAuth, requireRole('super_owner'), logAction((req, resBody) => ({
  action: 'INVITE_STAFF',
  entityType: 'User',
  entityId: resBody?.data?.id || 'unknown',
  metadata: { email: req.body.email, role: req.body.role }
}))(async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { email, name, role, permissions } = inviteSchema.parse(req.body)

    // Check if user already exists
    const existing = await prisma.user.findUnique({
      where: { email }
    })

    if (existing) {
      return res.status(400).json({ error: 'User with this email already exists' })
    }

    // Generate token and expiry
    const inviteToken = crypto.randomBytes(32).toString('hex')
    const inviteExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours

    // Create a dummy password hash (never valid for normal login anyway since we reset it)
    const dummyPassword = crypto.randomUUID()
    const passwordHash = await OtpService.hashPassword(dummyPassword)

    // Create the user transactionally along with their permissions
    const user = await prisma.user.create({
      data: {
        email,
        name,
        role: role as Role,
        passwordHash,
        inviteToken,
        inviteExpiry,
        emailVerified: true, // Verification is implicitly completed through invitation link
        adminPermissions: {
          create: permissions.map(perm => ({
            permission: perm
          }))
        }
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true
      }
    })

    // Send the email
    await BrevoService.sendInviteEmail(email, inviteToken)

    return res.status(201).json({
      success: true,
      message: 'Invitation sent successfully',
      data: user
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.issues[0]?.message || 'Validation error' })
    }
    console.error('Invite staff error:', error)
    return res.status(500).json({ error: 'Internal Server Error' })
  }
}))

// PATCH /api/admin/accounts/:id (super_owner only)
router.patch('/:id', requireAuth, requireRole('super_owner'), logAction((req, resBody) => ({
  action: 'UPDATE_STAFF_ACCOUNT',
  entityType: 'User',
  entityId: req.params.id,
  metadata: { isBlocked: req.body.isBlocked, role: req.body.role, permissionsCount: req.body.permissions?.length }
}))(async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params
    const { role, isBlocked, permissions } = updateAccountSchema.parse(req.body)

    // Find user
    const user = await prisma.user.findUnique({
      where: { id }
    })

    if (!user) {
      return res.status(404).json({ error: 'Staff account not found' })
    }

    if (user.role === 'super_owner' && req.user?.id !== id) {
      return res.status(403).json({ error: 'Cannot modify another super owner account' })
    }

    // Prepare update data
    const updateData: any = {}
    if (role !== undefined) updateData.role = role as Role
    if (isBlocked !== undefined) updateData.isBlocked = isBlocked

    // Perform database transactions
    await prisma.$transaction(async (tx) => {
      // Update basic fields
      if (Object.keys(updateData).length > 0) {
        await tx.user.update({
          where: { id },
          data: updateData
        })
      }

      // Update permissions if provided
      if (permissions !== undefined) {
        // Delete all old permissions
        await tx.adminPermission.deleteMany({
          where: { userId: id }
        })

        // Create new ones
        if (permissions.length > 0) {
          await tx.adminPermission.createMany({
            data: permissions.map(perm => ({
              userId: id,
              permission: perm
            }))
          })
        }
      }
    })

    return res.json({
      success: true,
      message: 'Account updated successfully'
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.issues[0]?.message || 'Validation error' })
    }
    console.error('Update staff account error:', error)
    return res.status(500).json({ error: 'Internal Server Error' })
  }
}))

// POST /api/auth/set-password (public)
export const setPasswordHandler = async (req: Request, res: Response) => {
  try {
    const { token, password } = setPasswordSchema.parse(req.body)

    const user = await prisma.user.findUnique({
      where: { inviteToken: token }
    })

    if (!user) {
      return res.status(400).json({ error: 'Invalid invitation token' })
    }

    if (user.inviteExpiry && user.inviteExpiry < new Date()) {
      return res.status(400).json({ error: 'Invitation token has expired' })
    }

    // Hash the new password
    const passwordHash = await OtpService.hashPassword(password)

    // Update user
    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        inviteToken: null,
        inviteExpiry: null
      }
    })

    return res.json({
      success: true,
      message: 'Password set successfully. You can now log in.'
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.issues[0]?.message || 'Validation error' })
    }
    console.error('Set password error:', error)
    return res.status(500).json({ error: 'Internal Server Error' })
  }
}

export default router
