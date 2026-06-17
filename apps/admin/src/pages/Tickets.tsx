import React, { useState, useEffect, useMemo } from 'react'
import { useAdminData } from '../context/AdminDataContext'

export const Tickets: React.FC = () => {
  const { tickets, ticketsLoading, fetchTickets, replyToTicket, updateTicketStatus } = useAdminData()

  // Selected ticket and filters
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState('All')
  const [priorityFilter, setPriorityFilter] = useState('All')
  const [replyText, setReplyText] = useState('')
  const [updatingParams, setUpdatingParams] = useState(false)
  const [ticketError, setTicketError] = useState<string | null>(null)
  const [ticketSuccess, setTicketSuccess] = useState<string | null>(null)
  const [isReplying, setIsReplying] = useState(false)

  // Fetch tickets on mount & when filters change
  useEffect(() => {
    fetchTickets({
      status: statusFilter,
      priority: priorityFilter
    })
  }, [statusFilter, priorityFilter])

  // Get active ticket
  const activeTicket = useMemo(() => {
    return tickets.find(t => t.id === selectedTicketId) || tickets[0] || null
  }, [tickets, selectedTicketId])

  // Set selected ticket to first one when list changes if none selected
  useEffect(() => {
    if (tickets.length > 0 && !selectedTicketId) {
      setSelectedTicketId(tickets[0].id)
    }
  }, [tickets])

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!activeTicket || !replyText.trim()) return

    setIsReplying(true)
    setTicketError(null)
    setTicketSuccess(null)
    try {
      await replyToTicket(activeTicket.id, replyText.trim())
      setReplyText('')
      setTicketSuccess('Reply sent successfully!')
    } catch (err: any) {
      setTicketError(err.message || 'Failed to send reply.')
    } finally {
      setIsReplying(false)
    }
  }

  const handleUpdateStatus = async (status: 'open' | 'in progress' | 'resolved') => {
    if (!activeTicket) return
    setUpdatingParams(true)
    setTicketError(null)
    setTicketSuccess(null)
    try {
      await updateTicketStatus(activeTicket.id, status, activeTicket.priority)
      setTicketSuccess('Ticket status updated successfully!')
    } catch (err: any) {
      setTicketError(err.message || 'Failed to update status.')
    } finally {
      setUpdatingParams(false)
    }
  }

  const handleUpdatePriority = async (priority: 'low' | 'medium' | 'high') => {
    if (!activeTicket) return
    setUpdatingParams(true)
    setTicketError(null)
    setTicketSuccess(null)
    try {
      await updateTicketStatus(activeTicket.id, activeTicket.status, priority)
      setTicketSuccess('Ticket priority updated successfully!')
    } catch (err: any) {
      setTicketError(err.message || 'Failed to update priority.')
    } finally {
      setUpdatingParams(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'open':
        return 'bg-accent-blue/10 text-accent-blue border border-accent-blue/30'
      case 'in progress':
      case 'in_progress':
        return 'bg-accent-yellow/10 text-ink border border-accent-yellow/30'
      case 'resolved':
        return 'bg-accent-teal/20 text-accent-teal border border-accent-teal/30'
      default:
        return 'bg-bg text-ink-muted border border-border'
    }
  }

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-primary/15 text-primary border border-primary/25 font-bold'
      case 'medium':
        return 'bg-accent-yellow/15 text-ink border border-accent-yellow/25'
      case 'low':
        return 'bg-bg text-ink-muted border border-border'
      default:
        return 'bg-bg text-ink-muted border border-border'
    }
  }

  return (
    <div className="space-y-4">
      {/* Title block */}
      <div className="border-b border-border pb-3 text-left flex justify-between items-center">
        <div>
          <h2 className="text-xl font-heading font-extrabold text-ink">Support Desk</h2>
          <p className="text-[11px] text-ink-muted leading-normal">
            Manage customer help requests, answer product/order questions, and resolve queries.
          </p>
        </div>
        <div className="flex gap-2">
          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="input-workshop py-1 px-2 text-xs bg-surface border border-border rounded"
          >
            <option value="All">All Statuses</option>
            <option value="open">Open</option>
            <option value="in progress">In Progress</option>
            <option value="resolved">Resolved</option>
          </select>

          {/* Priority Filter */}
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="input-workshop py-1 px-2 text-xs bg-surface border border-border rounded"
          >
            <option value="All">All Priorities</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
        </div>
      </div>

      {/* Main split grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 text-left items-stretch min-h-[60vh]">
        {/* Left Column: Tickets Listing directory */}
        <div className="bg-surface border border-border rounded shadow-sm flex flex-col h-[65vh] lg:h-auto">
          <div className="px-4 py-3 border-b border-border bg-bg/25">
            <h3 className="text-xs font-heading font-bold text-ink">Tickets Directory</h3>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-border/60">
            {ticketsLoading ? (
              <div className="p-8 text-center text-xs text-ink-muted italic">Loading support tickets...</div>
            ) : tickets.length > 0 ? (
              tickets.map((t) => (
                <div
                  key={t.id}
                  onClick={() => setSelectedTicketId(t.id)}
                  className={`p-3 cursor-pointer transition-colors ${
                    activeTicket?.id === t.id ? 'bg-primary/10 font-medium' : 'hover:bg-bg/40'
                  }`}
                >
                  <div className="flex justify-between items-start gap-1">
                    <span className="font-semibold text-xs text-ink line-clamp-1">{t.subject}</span>
                    <span className={`text-[9px] font-heading font-extrabold px-1.5 py-0.5 rounded-full border ${getStatusBadge(t.status)}`}>
                      {t.status}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-[10px] text-ink-muted mt-2">
                    <span>Ref: #{t.id.split('-')[1] || t.id}</span>
                    <span className={`px-1 rounded ${getPriorityBadge(t.priority)}`}>{t.priority}</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-xs text-ink-muted italic">No tickets found matching filters.</div>
            )}
          </div>
        </div>

        {/* Right 2 Columns: Active Ticket Thread Chat & Action Panel */}
        <div className="lg:col-span-2 bg-surface border border-border rounded shadow-sm flex flex-col justify-between h-[65vh] lg:h-auto overflow-hidden">
          {activeTicket ? (
            <div className="flex flex-col h-full">
              {/* Header Details */}
              <div className="p-4 border-b border-border bg-bg/15 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                <div className="text-left space-y-1">
                  <h3 className="font-heading font-bold text-sm text-ink">{activeTicket.subject}</h3>
                  <div className="flex flex-wrap items-center gap-2 text-[10px] text-ink-muted font-body">
                    <span>Ticket ID: {activeTicket.id}</span>
                    {activeTicket.orderRef && (
                      <span className="bg-bg px-1.5 py-0.5 rounded border border-border">
                        Order Ref: #{activeTicket.orderRef.split('-')[1] || activeTicket.orderRef}
                      </span>
                    )}
                    <span>User: {activeTicket.customerName} ({activeTicket.customerEmail})</span>
                  </div>
                </div>

                {/* Status/Priority action selectors */}
                <div className="flex items-center gap-2 select-none">
                  {/* Status update buttons */}
                  <div className="flex rounded border border-border overflow-hidden text-[10px] font-heading font-bold">
                    <button
                      onClick={() => handleUpdateStatus('open')}
                      disabled={updatingParams}
                      className={`px-2 py-1 border-r border-border transition-colors ${
                        activeTicket.status === 'open' ? 'bg-accent-blue text-white' : 'bg-surface text-ink hover:bg-bg'
                      }`}
                    >
                      Open
                    </button>
                    <button
                      onClick={() => handleUpdateStatus('in progress')}
                      disabled={updatingParams}
                      className={`px-2 py-1 border-r border-border transition-colors ${
                        activeTicket.status === 'in progress' ? 'bg-accent-yellow text-ink' : 'bg-surface text-ink hover:bg-bg'
                      }`}
                    >
                      In Progress
                    </button>
                    <button
                      onClick={() => handleUpdateStatus('resolved')}
                      disabled={updatingParams}
                      className={`px-2 py-1 transition-colors ${
                        activeTicket.status === 'resolved' ? 'bg-accent-teal text-white' : 'bg-surface text-ink hover:bg-bg'
                      }`}
                    >
                      Resolved
                    </button>
                  </div>

                  {/* Priority selector */}
                  <select
                    value={activeTicket.priority}
                    onChange={(e) => handleUpdatePriority(e.target.value as any)}
                    disabled={updatingParams}
                    className="border border-border rounded text-[10px] py-1 px-1.5 bg-surface text-ink font-heading font-bold"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
              </div>

              {/* Chat Thread Messages Box */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-bg/5">
                {activeTicket.messages.map((m, idx) => {
                  const isAdmin = m.sender === 'admin'
                  const dateStr = new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                  const dateDay = new Date(m.timestamp).toLocaleDateString()

                  return (
                    <div key={idx} className={`flex ${isAdmin ? 'justify-end' : 'justify-start'}`}>
                      <div
                        className={`max-w-[75%] rounded-lg p-3 text-xs font-body shadow-xs border ${
                          isAdmin
                            ? 'bg-accent-blue text-white border-accent-blue/20 rounded-tr-none'
                            : 'bg-bg text-ink border-border/80 rounded-tl-none'
                        }`}
                      >
                        <p className="leading-relaxed whitespace-pre-wrap">{m.text}</p>
                        <span className={`text-[8px] block text-right mt-1.5 ${isAdmin ? 'text-white/80' : 'text-ink-muted'}`}>
                          {dateDay} {dateStr}
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Reply Input Box */}
              <div className="p-3 border-t border-border bg-surface space-y-2">
                {ticketError && (
                  <div className="bg-primary/10 border border-primary/25 p-2.5 rounded-lg text-primary text-xs font-semibold">
                    ⚠️ {ticketError}
                  </div>
                )}
                {ticketSuccess && (
                  <div className="bg-accent-teal/10 border border-accent-teal/30 p-2.5 rounded-lg text-accent-teal text-xs font-semibold">
                    ✓ {ticketSuccess}
                  </div>
                )}
                {activeTicket.status !== 'resolved' ? (
                  <form onSubmit={handleSendReply} className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Type your response to user..."
                      value={replyText}
                      disabled={isReplying}
                      onChange={(e) => setReplyText(e.target.value)}
                      className="input-workshop text-xs py-2 px-3 border border-border rounded-md flex-1 bg-bg/30 text-ink focus:outline-none focus:border-secondary disabled:opacity-50"
                    />
                    <button
                      type="submit"
                      disabled={isReplying}
                      className="btn-primary bg-accent-blue hover:bg-accent-blue/90 text-white font-heading font-bold text-xs px-5 py-2 rounded-md shadow-xs transition duration-150 disabled:opacity-50"
                    >
                      {isReplying ? 'Sending...' : 'Send Reply'}
                    </button>
                  </form>
                ) : (
                  <div className="p-2.5 bg-accent-teal/10 text-accent-teal text-xs font-heading font-bold rounded border border-accent-teal/20 text-center">
                    Ticket is marked as resolved. Re-open ticket status to type a response.
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center space-y-2 py-16">
              <span className="text-4xl block animate-pulse">📬</span>
              <h3 className="text-sm font-heading text-ink font-bold">Select a Support Ticket</h3>
              <p className="text-[11px] font-body text-ink-muted max-w-xs leading-normal">
                Inspect queries from the directory to review customer replies and update desk logs.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
export default Tickets
