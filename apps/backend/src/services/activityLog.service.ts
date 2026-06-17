import { prisma } from '../lib/prisma'
import { Role } from '@prisma/client'

interface LogActivityParams {
  actorId: string
  actorRole: Role
  action: string
  entityType: string
  entityId: string
  metadata?: any
}

export class ActivityLogService {
  /**
   * Records an administrative action in the ActivityLog database table.
   * This service is designed to never throw errors that disrupt the user request lifecycle.
   */
  public static async logActivity(params: LogActivityParams): Promise<boolean> {
    try {
      const { actorId, action, entityType, entityId, metadata } = params

      // Look up actor details dynamically
      const user = await prisma.user.findUnique({
        where: { id: actorId },
        select: { email: true }
      })

      const actorEmail = user?.email || 'unknown@toycabin.com'

      await prisma.activityLog.create({
        data: {
          actorId,
          actorEmail,
          action,
          entity: entityType,
          entityId,
          newValue: metadata ? (metadata as any) : null
        }
      })

      console.log(`[ActivityLogService] Activity logged successfully: ${action} on ${entityType} (${entityId}) by user ${actorEmail}`)
      return true
    } catch (error) {
      console.error('[ActivityLogService] Safe catch block - Failed to log activity:', error)
      return false
    }
  }
}
