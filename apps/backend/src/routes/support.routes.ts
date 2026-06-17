import { Router, Response } from 'express'
import { z } from 'zod'
import { prisma } from '../lib/prisma'
import { requireAuth, requireRole, AuthenticatedRequest, rateLimit } from '../middleware/auth.middleware'
import { logAction } from '../middleware/activityLog.middleware'
import { TicketStatus, TicketPriority } from '@prisma/client'
import { BrevoService } from '../services/brevo.service'

const router = Router()

// Helper: map DB Ticket to JSON response DTO
function mapTicketToDto(t: any) {
  return {
    id: t.id,
    subject: t.subject,
    orderRef: t.orderRef || undefined,
    status: t.status === TicketStatus.in_progress ? 'in progress' : t.status,
    priority: t.priority,
    createdAt: t.createdAt,
    updatedAt: t.updatedAt,
    timestamp: t.createdAt.toISOString(),
    messages: t.messages
      ? t.messages.map((m: any) => ({
          sender: m.sender,
          text: m.message,
          timestamp: m.timestamp.toISOString()
        }))
      : [],
    user: t.user
      ? {
          name: t.user.name,
          email: t.user.email
        }
      : undefined
  }
}

// Zod validation schemas
const createTicketSchema = z.object({
  subject: z.string().min(1, 'Subject is required'),
  message: z.string().min(1, 'Message is required'),
  orderId: z.string().optional()
})

const createMessageSchema = z.object({
  message: z.string().min(1, 'Message cannot be empty')
})

const updateTicketSchema = z.object({
  status: z.enum(['open', 'in_progress', 'resolved']).optional(),
  priority: z.enum(['low', 'medium', 'high']).optional(),
  assignedAdminId: z.string().optional()
})

/**
 * -----------------------------------------------------------------------------
 * CUSTOMER ROUTES (requireAuth)
 * -----------------------------------------------------------------------------
 */

/**
 * POST /api/tickets
 * Create a new support ticket with status 'open' and the first TicketMessage.
 */
router.post('/tickets', requireAuth, rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  message: 'Too many support tickets created. Please try again in 1 hour.'
}), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id
    const data = createTicketSchema.parse(req.body)

    const createdTicket = await prisma.$transaction(async (tx) => {
      return tx.supportTicket.create({
        data: {
          userId,
          subject: data.subject,
          orderRef: data.orderId || null,
          status: TicketStatus.open,
          priority: TicketPriority.medium,
          messages: {
            create: {
              sender: 'customer',
              message: data.message
            }
          }
        },
        include: {
          messages: {
            orderBy: { timestamp: 'asc' }
          }
        }
      })
    })

    // Skip sending email notification to admin since no channel is defined in toy-ecommerce-backend.md
    console.log(`[SupportRoutes] Skipped admin email notification on new ticket by customer ${userId}. (No admin notification list configured)`)

    return res.status(201).json(mapTicketToDto(createdTicket))
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.issues[0]?.message || 'Validation error' })
    }
    console.error('[CreateTicket] Error:', error)
    return res.status(500).json({ error: 'Internal Server Error' })
  }
})

/**
 * GET /api/tickets
 * Retrieve cursor-paginated support tickets for the current user.
 */
router.get('/tickets', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id
    const cursor = req.query.cursor as string | undefined
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 100)

    const tickets = await prisma.supportTicket.findMany({
      where: { userId },
      take: limit + 1,
      cursor: cursor ? { id: cursor } : undefined,
      skip: cursor ? 1 : 0,
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      include: {
        messages: {
          orderBy: { timestamp: 'asc' }
        }
      }
    })

    const hasMore = tickets.length > limit
    if (hasMore) {
      tickets.pop()
    }
    const nextCursor = hasMore ? tickets[tickets.length - 1].id : null

    const mapped = tickets.map(mapTicketToDto)

    return res.json({
      items: mapped,
      tickets: mapped, // fallback alias
      nextCursor,
      hasMore
    })
  } catch (error) {
    console.error('[GetTickets] Error:', error)
    return res.status(500).json({ error: 'Internal Server Error' })
  }
})

/**
 * GET /api/tickets/:id
 * Retrieve detail of a specific ticket with message thread.
 */
router.get('/tickets/:id', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params
    const userId = req.user!.id

    const ticket = await prisma.supportTicket.findUnique({
      where: { id },
      include: {
        messages: {
          orderBy: { timestamp: 'asc' }
        }
      }
    })

    if (!ticket) {
      return res.status(404).json({ error: 'Support ticket not found.' })
    }

    if (ticket.userId !== userId) {
      return res.status(403).json({ error: 'Access denied. You do not own this ticket.' })
    }

    return res.json(mapTicketToDto(ticket))
  } catch (error) {
    console.error('[GetTicketDetail] Error:', error)
    return res.status(500).json({ error: 'Internal Server Error' })
  }
})

/**
 * POST /api/tickets/:id/messages
 * Add a customer reply to an existing support ticket thread.
 * Blocked if ticket status is 'resolved'.
 */
router.post('/tickets/:id/messages', requireAuth, rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 20,
  message: 'Too many messages sent. Please try again in 10 minutes.'
}), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params
    const userId = req.user!.id
    const data = createMessageSchema.parse(req.body)

    const ticket = await prisma.supportTicket.findUnique({
      where: { id }
    })

    if (!ticket) {
      return res.status(404).json({ error: 'Support ticket not found.' })
    }

    if (ticket.userId !== userId) {
      return res.status(403).json({ error: 'Access denied. You do not own this ticket.' })
    }

    if (ticket.status === TicketStatus.resolved) {
      return res.status(400).json({
        error: 'This ticket has been resolved. Please raise a new ticket instead of replying.'
      })
    }

    const updatedTicket = await prisma.$transaction(async (tx) => {
      // Create new message
      await tx.ticketMessage.create({
        data: {
          ticketId: id,
          sender: 'customer',
          message: data.message
        }
      })

      // Update ticket status to open/in_progress on customer message
      return tx.supportTicket.update({
        where: { id },
        data: {
          status: TicketStatus.open
        },
        include: {
          messages: {
            orderBy: { timestamp: 'asc' }
          }
        }
      })
    })

    // Skip sending email notification to admin since no channel is defined in toy-ecommerce-backend.md
    console.log(`[SupportRoutes] Skipped admin email notification on customer reply. (No admin notification list configured)`)

    return res.json(mapTicketToDto(updatedTicket))
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.issues[0]?.message || 'Validation error' })
    }
    console.error('[AddCustomerMessage] Error:', error)
    return res.status(500).json({ error: 'Internal Server Error' })
  }
})

/**
 * -----------------------------------------------------------------------------
 * ADMIN ROUTES (requireAuth + requireRole admin)
 * -----------------------------------------------------------------------------
 */

/**
 * GET /api/admin/tickets
 * Paginated list of support tickets for admin dashboard. Filterable by status and priority.
 */
router.get(
  '/admin/tickets',
  requireAuth,
  requireRole('super_owner', 'sub_admin'),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const limit = Math.min(parseInt(req.query.limit as string) || 20, 100)
      const cursor = req.query.cursor as string | undefined

      const status = req.query.status as string | undefined
      const priority = req.query.priority as string | undefined

      const where: any = {}

      if (status && status !== 'All') {
        const mappedStatus = status.toLowerCase() === 'in progress' ? TicketStatus.in_progress : (status.toLowerCase() as TicketStatus)
        where.status = mappedStatus
      }

      if (priority && priority !== 'All') {
        where.priority = priority.toLowerCase() as TicketPriority
      }

      const tickets = await prisma.supportTicket.findMany({
        where,
        take: limit + 1,
        cursor: cursor ? { id: cursor } : undefined,
        skip: cursor ? 1 : 0,
        orderBy: [{ updatedAt: 'desc' }, { id: 'desc' }],
        include: {
          messages: {
            orderBy: { timestamp: 'asc' }
          },
          user: {
            select: {
              name: true,
              email: true
            }
          }
        }
      })

      const hasMore = tickets.length > limit
      if (hasMore) {
        tickets.pop()
      }
      const nextCursor = hasMore ? tickets[tickets.length - 1].id : null
      const mapped = tickets.map(mapTicketToDto)

      return res.json({
        items: mapped,
        tickets: mapped, // fallback alias
        nextCursor,
        hasMore
      })
    } catch (error) {
      console.error('[AdminGetTickets] Error:', error)
      return res.status(500).json({ error: 'Internal Server Error' })
    }
  }
)

/**
 * GET /api/admin/tickets/:id
 * Retrieve details of a support ticket with full message thread for admin.
 */
router.get(
  '/admin/tickets/:id',
  requireAuth,
  requireRole('super_owner', 'sub_admin'),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params

      const ticket = await prisma.supportTicket.findUnique({
        where: { id },
        include: {
          messages: {
            orderBy: { timestamp: 'asc' },
          },
          user: {
            select: {
              name: true,
              email: true
            }
          }
        }
      })

      if (!ticket) {
        return res.status(404).json({ error: 'Support ticket not found.' })
      }

      return res.json(mapTicketToDto(ticket))
    } catch (error) {
      console.error('[AdminGetTicketDetail] Error:', error)
      return res.status(500).json({ error: 'Internal Server Error' })
    }
  }
)

/**
 * POST /api/admin/tickets/:id/messages
 * Add an admin reply to a ticket thread. Sends a Brevo email to the customer.
 */
router.post(
  '/admin/tickets/:id/messages',
  requireAuth,
  requireRole('super_owner', 'sub_admin'),
  logAction((req, resBody) => ({
    action: 'REPLY_TO_TICKET',
    entityType: 'SupportTicket',
    entityId: req.params.id,
    metadata: { messageLength: req.body.message?.length || 0 }
  }))(async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params
      const data = createMessageSchema.parse(req.body)

      const ticket = await prisma.supportTicket.findUnique({
        where: { id },
        include: {
          user: {
            select: { email: true }
          }
        }
      })

      if (!ticket) {
        return res.status(404).json({ error: 'Support ticket not found.' })
      }

      const updatedTicket = await prisma.$transaction(async (tx) => {
        // Create new message
        await tx.ticketMessage.create({
          data: {
            ticketId: id,
            sender: 'admin',
            message: data.message
          }
        })

        // Update ticket status to in_progress on admin reply if currently open
        const newStatus = ticket.status === TicketStatus.open ? TicketStatus.in_progress : ticket.status

        return tx.supportTicket.update({
          where: { id },
          data: {
            status: newStatus
          },
          include: {
            messages: {
              orderBy: { timestamp: 'asc' }
            },
            user: {
              select: { name: true, email: true }
            }
          }
        })
      })

      // Send Brevo email to customer
      if (ticket.user?.email) {
        BrevoService.sendTicketNotification(
          ticket.user.email,
          ticket.subject,
          'Support Agent',
          data.message
        ).catch((err) => {
          console.error('[AdminReply] Async Brevo notification failed:', err)
        })
      }

      return res.json(mapTicketToDto(updatedTicket))
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.issues[0]?.message || 'Validation error' })
      }
      console.error('[AdminReplyTicket] Error:', error)
      return res.status(500).json({ error: 'Internal Server Error' })
    }
  })
)

/**
 * PATCH /api/admin/tickets/:id
 * Update support ticket parameters (status, priority, assignedAdminId).
 * Logs virtual assignedAdminId changes to activity log.
 */
router.patch(
  '/admin/tickets/:id',
  requireAuth,
  requireRole('super_owner', 'sub_admin'),
  logAction((req, resBody) => ({
    action: 'UPDATE_TICKET_PARAMS',
    entityType: 'SupportTicket',
    entityId: req.params.id,
    metadata: {
      status: req.body.status,
      priority: req.body.priority,
      assignedAdminId: req.body.assignedAdminId
    }
  }))(async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params
      const data = updateTicketSchema.parse(req.body)

      const ticket = await prisma.supportTicket.findUnique({
        where: { id }
      })

      if (!ticket) {
        return res.status(404).json({ error: 'Support ticket not found.' })
      }

      const updatePayload: any = {}

      if (data.status) {
        updatePayload.status = data.status === 'in_progress' ? TicketStatus.in_progress : (data.status as TicketStatus)
      }

      if (data.priority) {
        updatePayload.priority = data.priority as TicketPriority
      }

      const updated = await prisma.supportTicket.update({
        where: { id },
        data: updatePayload,
        include: {
          messages: {
            orderBy: { timestamp: 'asc' }
          },
          user: {
            select: { name: true, email: true }
          }
        }
      })

      // If status changed to resolved, we can notify customer as well (optional nice touch)
      if (data.status === 'resolved' && updated.user?.email) {
        BrevoService.sendTicketNotification(
          updated.user.email,
          updated.subject,
          'Support System',
          'This ticket has been marked resolved. If you have further issues, please raise a new support ticket.'
        ).catch((err) => {
          console.error('[AdminUpdateTicketStatus] Async Brevo notification failed:', err)
        })
      }

      return res.json(mapTicketToDto(updated))
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.issues[0]?.message || 'Validation error' })
      }
      console.error('[AdminUpdateTicket] Error:', error)
      return res.status(500).json({ error: 'Internal Server Error' })
    }
  })
)

export default router
