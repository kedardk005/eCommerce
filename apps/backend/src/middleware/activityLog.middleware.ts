import { Response, NextFunction } from 'express'
import { AuthenticatedRequest } from './auth.middleware'
import { ActivityLogService } from '../services/activityLog.service'

export type ActionDescriptionFn = (req: AuthenticatedRequest, resBody: any) => {
  action: string
  entityType: string
  entityId: string
  metadata?: any
}

/**
 * Higher-order middleware to selectively wrap controller actions.
 * Intercepts successful (2xx) responses and logs activity in the background.
 *
 * Example:
 * router.post('/products', requireAuth, requireRole('super_owner', 'sub_admin'),
 *   logAction((req, body) => ({
 *     action: 'CREATE_PRODUCT',
 *     entityType: 'Product',
 *     entityId: body.id,
 *     metadata: { title: req.body.title }
 *   }))(createProductController)
 * )
 */
export const logAction = (actionDescriptionFn: ActionDescriptionFn) => {
  return (handler: (req: AuthenticatedRequest, res: Response, next: NextFunction) => any) => {
    return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
      const originalJson = res.json.bind(res)
      let resBody: any = null

      // Intercept res.json
      res.json = (body: any) => {
        resBody = body
        return originalJson(body)
      }

      try {
        await handler(req, res, next)

        // Only log successful 2xx actions performed by authenticated actors
        if (res.statusCode >= 200 && res.statusCode < 300 && req.user) {
          const { id: actorId, role: actorRole } = req.user

          try {
            const description = actionDescriptionFn(req, resBody)
            if (description) {
              const { action, entityType, entityId, metadata } = description

              // Execute logActivity in background so it never blocks the request
              ActivityLogService.logActivity({
                actorId,
                actorRole,
                action,
                entityType,
                entityId,
                metadata
              }).catch(err => {
                console.error('[ActivityLogMiddleware] Async log failed:', err)
              })
            }
          } catch (descError) {
            console.error('[ActivityLogMiddleware] Description evaluator threw an error:', descError)
          }
        }
      } catch (error) {
        // Forward error to global handler
        next(error)
      }
    }
  }
}
