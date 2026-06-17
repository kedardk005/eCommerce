import { Router, Response } from 'express'
import { prisma } from '../lib/prisma'
import { requireAuth, requireRole, AuthenticatedRequest } from '../middleware/auth.middleware'
import { PaymentStatus, RefundStatus, OrderStatus } from '@prisma/client'
import { CacheService } from '../services/cache.service'

const router = Router()

/**
 * GET /api/admin/finance/summary
 * Fetch sales totals: revenue, refunds, net profit, and pending COD collections.
 * Super Owner only. Cached for 2 minutes.
 */
router.get(
  '/summary',
  requireAuth,
  requireRole('super_owner'),
  async (req: AuthenticatedRequest, res: Response) => {
    const cacheKey = 'finance:summary'
    const cached = CacheService.get(cacheKey)
    if (cached) {
      return res.json(cached)
    }

    try {
      // 1. Calculate revenue: Sum of captured Payments (PaymentStatus.paid)
      const revenueAgg = await prisma.payment.aggregate({
        where: { status: PaymentStatus.paid },
        _sum: { amount: true }
      })
      const revenue = revenueAgg._sum.amount || 0

      // 2. Calculate refunds: Sum of Return records with RefundStatus.processed
      const refundsAgg = await prisma.return.aggregate({
        where: { refundStatus: RefundStatus.processed },
        _sum: { refundAmount: true }
      })
      const refunds = refundsAgg._sum.refundAmount || 0

      // 3. Calculate net
      const net = revenue - refunds

      // 4. Pending COD collections: Sum of COD orders in non-delivered, non-cancelled states with pending payment
      const pendingCodAgg = await prisma.order.aggregate({
        where: {
          payments: {
            some: {
              method: 'Cash on Delivery',
              status: PaymentStatus.pending
            }
          },
          orderStatus: {
            notIn: [OrderStatus.delivered, OrderStatus.cancelled]
          }
        },
        _sum: { total: true }
      })
      const pendingCod = pendingCodAgg._sum.total || 0

      const summary = {
        revenue: revenue / 100, // convert to UI currency (dollars)
        refunds: refunds / 100,
        net: net / 100,
        pendingCod: pendingCod / 100
      }

      // Cache for 2 minutes
      CacheService.set(cacheKey, summary, 2 * 60 * 1000)

      return res.json(summary)
    } catch (error) {
      console.error('[FinanceRoutes] Error generating summary:', error)
      return res.status(500).json({ error: 'Internal Server Error' })
    }
  }
)

/**
 * GET /api/admin/finance/transactions
 * Paginated log of all transactions (captured payments + return refunds).
 * Filterable by type ('payment' | 'refund') and date range.
 * Super Owner only.
 */
router.get(
  '/transactions',
  requireAuth,
  requireRole('super_owner'),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const type = req.query.type as string | undefined // 'payment', 'refund', or 'all'
      const startDate = req.query.startDate as string | undefined
      const endDate = req.query.endDate as string | undefined
      
      const page = Math.max(parseInt(req.query.page as string) || 1, 1)
      const limit = Math.min(Math.max(parseInt(req.query.limit as string) || 20, 1), 100)
      const skip = (page - 1) * limit

      // Build date conditions
      const dateFilter: any = {}
      if (startDate) {
        dateFilter.gte = new Date(startDate)
      }
      if (endDate) {
        // Include full day
        const end = new Date(endDate)
        end.setDate(end.getDate() + 1)
        dateFilter.lt = end
      }
      const hasDateFilter = startDate || endDate

      let rawTransactions: any[] = []

      // 1. Fetch Payments (type: 'payment')
      if (!type || type === 'all' || type === 'payment') {
        const paymentsWhere: any = { status: PaymentStatus.paid }
        if (hasDateFilter) {
          paymentsWhere.createdAt = dateFilter
        }
        const payments = await prisma.payment.findMany({
          where: paymentsWhere,
          include: {
            order: {
              select: {
                id: true,
                user: { select: { name: true } }
              }
            }
          }
        })
        rawTransactions.push(
          ...payments.map(p => ({
            id: p.id,
            orderId: p.orderId,
            customerName: p.order?.user?.name || 'Customer',
            amount: p.amount / 100,
            type: 'payment',
            method: p.method,
            createdAt: p.createdAt
          }))
        )
      }

      // 2. Fetch Refunds (type: 'refund')
      if (!type || type === 'all' || type === 'refund') {
        const refundsWhere: any = { refundStatus: RefundStatus.processed }
        if (hasDateFilter) {
          refundsWhere.createdAt = dateFilter
        }
        const refunds = await prisma.return.findMany({
          where: refundsWhere,
          include: {
            order: {
              select: {
                user: { select: { name: true } }
              }
            }
          }
        })
        rawTransactions.push(
          ...refunds.map(r => ({
            id: r.id,
            orderId: r.orderId,
            customerName: r.order?.user?.name || 'Customer',
            amount: r.refundAmount / 100,
            type: 'refund',
            method: 'Online Refund',
            createdAt: r.createdAt
          }))
        )
      }

      // 3. Sort by createdAt desc
      rawTransactions.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())

      // 4. Paginate
      const total = rawTransactions.length
      const paginated = rawTransactions.slice(skip, skip + limit)

      return res.json({
        items: paginated,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      })
    } catch (error) {
      console.error('[FinanceRoutes] Error listing transactions:', error)
      return res.status(500).json({ error: 'Internal Server Error' })
    }
  }
)

export default router
