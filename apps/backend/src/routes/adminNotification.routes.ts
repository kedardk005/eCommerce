import { Router, Response } from 'express'
import { prisma } from '../lib/prisma'
import { requireAuth, requireRole, AuthenticatedRequest } from '../middleware/auth.middleware'
import { OrderStatus, TicketStatus } from '@prisma/client'

const router = Router()

/**
 * GET /api/admin/notifications
 * Fetch recent dynamic administrative alerts.
 * Gated to super_owner / sub_admin.
 */
router.get(
  '/',
  requireAuth,
  requireRole('super_owner', 'sub_admin'),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      // 1. Fetch low stock threshold settings
      const settings = await prisma.settings.findUnique({
        where: { id: 'global' }
      })
      const threshold = settings?.lowStockThreshold ?? 10

      // 2. Query low stock variants
      const lowStockVariants = await prisma.productVariant.findMany({
        where: { stock: { lt: threshold } },
        take: 5,
        include: { product: true }
      })

      // 3. Query recent orders
      const recentOrders = await prisma.order.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: { name: true }
          }
        }
      })

      // 4. Query open support tickets
      const openTickets = await prisma.supportTicket.findMany({
        where: { status: TicketStatus.open },
        take: 5,
        orderBy: { updatedAt: 'desc' },
        include: {
          user: {
            select: { name: true }
          }
        }
      })

      // 5. Build combined notifications array
      const notifications: any[] = []

      // Add low stock warnings
      lowStockVariants.forEach((v) => {
        const variantName = v.attributes ? (v.attributes as any).name || 'Standard' : 'Standard'
        notifications.push({
          id: `low-stock-${v.id}`,
          type: 'LOW_STOCK',
          title: '⚠️ Low Stock Alert',
          message: `"${v.product.title} - ${variantName}" is running low (${v.stock} left).`,
          createdAt: v.updatedAt,
          targetUrl: '/inventory'
        })
      })

      // Add new order alerts
      recentOrders.forEach((o) => {
        notifications.push({
          id: `new-order-${o.id}`,
          type: 'NEW_ORDER',
          title: `📦 New Order #${o.id}`,
          message: `${o.user?.name || 'Customer'} placed an order (${(o.total / 100).toFixed(2)} INR)`,
          createdAt: o.createdAt,
          targetUrl: `/orders/${o.id}`
        })
      })

      // Add support ticket replies
      openTickets.forEach((t) => {
        notifications.push({
          id: `new-ticket-${t.id}`,
          type: 'NEW_TICKET',
          title: `💬 Support Ticket #${t.id.substring(0, 8)}`,
          message: `Query from ${t.user?.name || 'Customer'}: "${t.subject}"`,
          createdAt: t.updatedAt,
          targetUrl: '/support'
        })
      })

      // Sort combined notifications by date descending
      notifications.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

      // Take latest 15 alerts
      const slicedNotifications = notifications.slice(0, 15)

      return res.json({
        items: slicedNotifications,
        total: slicedNotifications.length
      })
    } catch (error) {
      console.error('[AdminNotifications] Error fetching alerts:', error)
      return res.status(500).json({ error: 'Internal Server Error' })
    }
  }
)

export default router
