import React, { createContext, useContext, useState, useEffect } from 'react'
import type { ReactNode } from 'react'
import { useAuth } from './AuthContext'

export interface TicketMessage {
  sender: 'customer' | 'admin'
  text: string
  timestamp: string
}

export interface Ticket {
  id: string
  subject: string
  orderRef?: string
  status: 'open' | 'in progress' | 'resolved'
  messages: TicketMessage[]
  timestamp: string
}

interface TicketsContextType {
  tickets: Ticket[]
  loading: boolean
  error: string | null
  addTicket: (subject: string, message: string, orderRef?: string) => Promise<void>
  addMessage: (ticketId: string, text: string) => Promise<void>
  fetchTickets: () => Promise<void>
}

const TicketsContext = createContext<TicketsContextType | undefined>(undefined)

export const TicketsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { isLoggedIn } = useAuth()
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const mapBackendTicketToFrontend = (t: any): Ticket => {
    return {
      id: t.id,
      subject: t.subject,
      orderRef: t.orderRef || undefined,
      status: t.status === 'in_progress' ? 'in progress' : t.status,
      timestamp: t.timestamp || t.createdAt,
      messages: (t.messages || []).map((m: any) => ({
        sender: m.sender,
        text: m.text || m.message,
        timestamp: m.timestamp
      }))
    }
  }

  const fetchTickets = async () => {
    const token = localStorage.getItem('accessToken')
    if (!token) return

    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/tickets?limit=100', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      if (!res.ok) {
        throw new Error('Failed to fetch support tickets')
      }
      const data = await res.json()
      // Handled paginated list shape { tickets, nextCursor, hasMore } or raw list
      const rawTickets = Array.isArray(data) ? data : (data.items || data.tickets || [])
      setTickets(rawTickets.map((t: any) => mapBackendTicketToFrontend(t)))
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const addTicket = async (subject: string, message: string, orderRef?: string) => {
    const token = localStorage.getItem('accessToken')
    if (!token) {
      throw new Error('Authentication required')
    }

    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/tickets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          subject,
          message,
          orderId: orderRef
        })
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Failed to submit support ticket.')
      }

      await fetchTickets()
    } catch (err: any) {
      setError(err.message)
      throw err
    } finally {
      setLoading(false)
    }
  }

  const addMessage = async (ticketId: string, text: string) => {
    const token = localStorage.getItem('accessToken')
    if (!token) {
      throw new Error('Authentication required')
    }

    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/tickets/${ticketId}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          message: text
        })
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Failed to post message reply.')
      }

      await fetchTickets()
    } catch (err: any) {
      setError(err.message)
      throw err
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isLoggedIn) {
      fetchTickets()
    } else {
      setTickets([])
    }
  }, [isLoggedIn])

  return (
    <TicketsContext.Provider value={{ tickets, loading, error, addTicket, addMessage, fetchTickets }}>
      {children}
    </TicketsContext.Provider>
  )
}

export const useTickets = () => {
  const context = useContext(TicketsContext)
  if (context === undefined) {
    throw new Error('useTickets must be used within a TicketsProvider')
  }
  return context
}
