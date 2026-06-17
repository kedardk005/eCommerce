import { Router, Response } from 'express'
import { prisma } from '../lib/prisma'
import { requireAuth, requireRole, AuthenticatedRequest } from '../middleware/auth.middleware'

const router = Router()

// GET /api/admin/activity-logs (super_owner or sub_admin)
router.get('/', requireAuth, requireRole('super_owner', 'sub_admin'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { actorEmail, entity, startDate, endDate, limit = '100', cursor } = req.query

    const where: any = {}

    if (actorEmail) {
      where.actorEmail = {
        contains: String(actorEmail),
        mode: 'insensitive'
      }
    }
    if (entity && entity !== 'All') {
      where.entity = String(entity)
    }
    if (startDate || endDate) {
      where.createdAt = {}
      if (startDate) {
        where.createdAt.gte = new Date(String(startDate))
      }
      if (endDate) {
        where.createdAt.lte = new Date(String(endDate))
      }
    }

    const take = Math.min(parseInt(String(limit), 10) || 100, 500)

    const queryOptions: any = {
      where,
      take: take + 1,
      orderBy: [
        { createdAt: 'desc' },
        { id: 'desc' }
      ],
      include: {
        actor: {
          select: {
            name: true,
            email: true,
            role: true
          }
        }
      }
    }

    if (cursor) {
      queryOptions.cursor = { id: String(cursor) }
      queryOptions.skip = 1 // Skip the cursor itself
    }

    const logs = await prisma.activityLog.findMany(queryOptions) as any[]

    let nextCursor: string | null = null
    let hasMore = false

    if (logs.length > take) {
      hasMore = true
      const nextItem = logs[take - 1]
      nextCursor = nextItem.id
      logs.pop() // Remove the extra item
    }

    // Map DB logs to UI expected shape
    const items = logs.map(log => ({
      id: log.id,
      actorName: log.actor?.name || 'System',
      actorEmail: log.actorEmail,
      action: log.action,
      entityType: log.entity,
      entityId: log.entityId,
      actionDescription: `${log.actor?.name || 'System'} performed ${log.action.replace(/_/g, ' ').toLowerCase()} on ${log.entity} (${log.entityId})`,
      timestamp: log.createdAt.toISOString().replace('T', ' ').substring(0, 19),
      oldValue: log.oldValue,
      newValue: log.newValue
    }))

    return res.json({
      items,
      nextCursor,
      hasMore
    })
  } catch (error) {
    console.error('Fetch activity logs error:', error)
    return res.status(500).json({ error: 'Internal Server Error' })
  }
})

export default router
