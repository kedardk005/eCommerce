import React, { useState, useMemo } from 'react'
import { useTickets } from '../context/TicketsContext'
import { useOrders } from '../context/OrdersContext'
import PageContainer from '../components/PageContainer'
import BadgeTag from '../components/BadgeTag'
import EmptyState from '../components/EmptyState'

export const Tickets: React.FC = () => {
  const { tickets, loading, error, addTicket, addMessage, fetchTickets } = useTickets()
  const { orders } = useOrders()

  // Selected ticket ID to show details thread
  const [selectedTicketId, setSelectedTicketId] = useState<string>(tickets[0]?.id || '')

  // Form states
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [orderRef, setOrderRef] = useState('')
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)

  // Thread text entry state
  const [replyText, setReplyText] = useState('')
  const [isReplying, setIsReplying] = useState(false)
  const [replyError, setReplyError] = useState<string | null>(null)

  const activeTicket = useMemo(() => {
    return tickets.find((t) => t.id === selectedTicketId)
  }, [tickets, selectedTicketId])

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault()
    setCreateError(null)
    if (!subject.trim() || !message.trim()) {
      setCreateError('Please fill out Subject and Message.')
      return
    }

    setIsCreating(true)
    try {
      await addTicket(subject.trim(), message.trim(), orderRef || undefined)

      // Reset Form
      setSubject('')
      setMessage('')
      setOrderRef('')
      setShowCreateForm(false)
    } catch (err: any) {
      setCreateError(err.message || 'Failed to raise support ticket.')
    } finally {
      setIsCreating(false)
    }
  }

  // Auto-select first ticket if none selected and tickets exist
  React.useEffect(() => {
    if (!selectedTicketId && tickets.length > 0) {
      setSelectedTicketId(tickets[0].id)
    }
  }, [tickets, selectedTicketId])

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault()
    setReplyError(null)
    if (!replyText.trim()) return

    setIsReplying(true)
    try {
      await addMessage(selectedTicketId, replyText.trim())
      setReplyText('')
    } catch (err: any) {
      setReplyError(err.message || 'Failed to send reply.')
    } finally {
      setIsReplying(false)
    }
  }

  const getStatusVariant = (status: string): 'red' | 'yellow' | 'green' | 'blue' | 'secondary' | 'default' => {
    switch (status) {
      case 'open':
        return 'blue'
      case 'in progress':
        return 'yellow'
      case 'resolved':
        return 'green'
      default:
        return 'default'
    }
  }

  return (
    <PageContainer className="space-y-8 pb-16">
      <div className="text-left flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="space-y-1">
          <span className="text-xs uppercase font-heading tracking-widest text-ink-muted font-bold block">Cabin Support</span>
          <h1 className="text-3xl sm:text-4xl font-heading text-ink tracking-tight mb-1 select-none font-bold">Support Tickets</h1>
          <p className="text-ink-muted font-body text-sm sm:text-base">Submit queries and communicate with our customer cabin helpers.</p>
        </div>
        <button
          onClick={() => {
            setCreateError(null)
            setReplyError(null)
            setShowCreateForm(!showCreateForm)
          }}
          disabled={loading}
          className="btn-primary bg-accent-yellow hover:bg-accent-yellow/95 disabled:bg-border disabled:text-ink-muted text-ink font-heading font-bold py-2.5 px-6 rounded-md shadow-xs select-none"
        >
          {showCreateForm ? 'View Tickets Log' : 'Raise New Ticket'}
        </button>
      </div>

      {loading && tickets.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 space-y-4">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
          <p className="text-ink-muted font-body text-sm">Loading support tickets...</p>
        </div>
      ) : error && tickets.length === 0 ? (
        <div className="bg-primary/10 border border-primary/25 p-6 rounded-lg text-primary text-sm font-semibold max-w-md mx-auto text-center space-y-4">
          <p>⚠️ Failed to load support tickets: {error}</p>
          <button
            onClick={() => fetchTickets()}
            className="btn-primary bg-primary text-white text-xs px-4 py-2 rounded hover:bg-primary-hover font-heading uppercase font-bold tracking-wider"
          >
            Retry Connection
          </button>
        </div>
      ) : showCreateForm ? (
        /* RAISE A TICKET FORM */
        <div className="card-workshop bg-surface border-b-[3px] border-primary p-6 shadow-xs max-w-xl mx-auto text-left space-y-4">
          <h3 className="text-xl font-heading text-ink font-bold border-b border-border/40 pb-2">
            Raise a Support Ticket
          </h3>
          {createError && (
            <div className="bg-primary/10 border border-primary/25 p-3 rounded-lg text-primary text-xs font-semibold">
              ⚠️ {createError}
            </div>
          )}
          <form onSubmit={handleCreateTicket} className="space-y-4">
            <div>
              <label className="block text-xs font-heading font-bold text-ink mb-1">Subject</label>
              <input
                type="text"
                required
                disabled={isCreating}
                placeholder="e.g. Broken part in balancing blocks"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="input-workshop disabled:opacity-50"
              />
            </div>

            <div>
              <label className="block text-xs font-heading font-bold text-ink mb-1">
                Order Reference (Optional)
              </label>
              <select
                value={orderRef}
                disabled={isCreating}
                onChange={(e) => setOrderRef(e.target.value)}
                className="input-workshop disabled:opacity-50"
              >
                <option value="">-- No Order Selected --</option>
                {orders.map((o) => (
                  <option key={o.id} value={o.id}>
                    Order #{o.id.split('-')[1] || o.id} - ${o.total.toFixed(2)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-heading font-bold text-ink mb-1">Message Detail</label>
              <textarea
                required
                rows={4}
                disabled={isCreating}
                placeholder="Describe your issue or query in detail..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="input-workshop disabled:opacity-50"
              />
            </div>

            <button
              type="submit"
              disabled={isCreating}
              className="btn-primary bg-accent-blue hover:bg-accent-blue/90 disabled:bg-border disabled:text-ink-muted text-white font-heading font-bold text-xs px-5 py-2.5 rounded shadow-xs flex items-center justify-center space-x-1.5"
            >
              {isCreating && <span className="animate-spin mr-1">⌛</span>}
              <span>Submit Ticket</span>
            </button>
          </form>
        </div>
      ) : tickets.length === 0 ? (
        <EmptyState
          title="No Tickets Raised"
          message="Submit support queries to communicate directly with our customer helpers."
          buttonText="Raise Support Ticket"
          onClick={() => setShowCreateForm(true)}
        />
      ) : (
        /* TICKETS LIST AND CHAT THREAD DUAL COLUMNS */
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch min-h-[50vh]">
          {/* Left: Tickets List column */}
          <div className="card-workshop bg-surface border-b-[3px] border-primary p-5 shadow-xs space-y-4 overflow-y-auto text-left h-[60vh] md:h-auto select-none">
            <h3 className="font-heading font-bold text-ink text-base border-b border-border/40 pb-2">
              Ticket Logs
            </h3>
            
            <div className="space-y-3">
              {tickets.map((t) => (
                <div
                  key={t.id}
                  onClick={() => {
                    setReplyError(null)
                    setSelectedTicketId(t.id)
                  }}
                  className={`p-3 rounded-lg border cursor-pointer transition ${
                    selectedTicketId === t.id
                      ? 'border-secondary bg-bg shadow-xs border-b-[2.5px] border-b-primary'
                      : 'border-border bg-bg/20 hover:bg-bg/50 border-b-[2.5px] border-b-transparent'
                  }`}
                >
                  <div className="flex justify-between items-start gap-1">
                    <span className="font-heading font-bold text-sm text-ink line-clamp-1">
                      {t.subject}
                    </span>
                    <BadgeTag text={t.status} variant={getStatusVariant(t.status)} className="scale-75 origin-right" />
                  </div>
                  <div className="flex justify-between items-center text-[10px] text-ink-muted font-body mt-2.5 pt-1.5 border-t border-border/10">
                    <span>ID: {t.id.split('-')[1] || t.id}</span>
                    <span>{new Date(t.timestamp).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right: Active Ticket Thread Chat column */}
          <div className="md:col-span-2 card-workshop bg-surface border-b-[3px] border-primary p-6 shadow-xs flex flex-col justify-between h-[60vh] md:h-auto">
            {activeTicket ? (
              <div className="flex flex-col justify-between h-full space-y-4">
                {/* Thread Header */}
                <div className="border-b border-border/40 pb-3 text-left">
                  <div className="flex justify-between items-center">
                    <h3 className="font-heading font-bold text-lg text-ink">{activeTicket.subject}</h3>
                    <BadgeTag text={activeTicket.status} variant={getStatusVariant(activeTicket.status)} />
                  </div>
                  <p className="text-xs font-body text-ink-muted mt-1">
                    Ticket ID: {activeTicket.id} {activeTicket.orderRef && `| Order Ref: #${activeTicket.orderRef.split('-')[1] || activeTicket.orderRef}`}
                  </p>
                </div>

                {/* Messages Chat Box */}
                <div className="flex-1 overflow-y-auto space-y-4 p-4 bg-bg/15 rounded-lg border border-border/40 text-left min-h-[30vh]">
                  {activeTicket.messages.map((m, idx) => {
                    const isAdmin = m.sender === 'admin'
                    const dateStr = new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

                    return (
                      <div
                        key={idx}
                        className={`flex ${isAdmin ? 'justify-start' : 'justify-end'}`}
                      >
                        <div
                          className={`max-w-[80%] rounded-xl p-3.5 text-sm font-body shadow-xs ${
                            isAdmin
                              ? 'bg-bg text-ink rounded-bl-none border border-border'
                              : 'bg-accent-blue text-white rounded-br-none'
                          }`}
                        >
                          <p className="leading-relaxed whitespace-pre-wrap">{m.text}</p>
                          <span className={`text-[9px] block text-right mt-2 ${isAdmin ? 'text-ink-muted' : 'text-white/80'}`}>
                            {dateStr}
                          </span>
                        </div>
                      </div>
                    )
                  })}
                </div>

                {/* Reply Form */}
                {activeTicket.status !== 'resolved' ? (
                  <div className="space-y-2">
                    {replyError && (
                      <div className="bg-primary/10 border border-primary/25 p-2 rounded text-primary text-xs font-semibold text-left">
                        ⚠️ {replyError}
                      </div>
                    )}
                    <form onSubmit={handleSendReply} className="flex gap-3 pt-1">
                      <input
                        type="text"
                        required
                        disabled={isReplying}
                        placeholder="Type your reply to helper..."
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        className="input-workshop disabled:opacity-50"
                      />
                      <button
                        type="submit"
                        disabled={isReplying}
                        className="btn-primary bg-accent-blue hover:bg-accent-blue/90 disabled:bg-border disabled:text-ink-muted text-white font-heading font-bold text-sm px-6 py-2.5 rounded-md shadow-xs flex items-center shrink-0"
                      >
                        {isReplying && <span className="animate-spin mr-1">⌛</span>}
                        <span>Send</span>
                      </button>
                    </form>
                  </div>
                ) : (
                  <div className="p-3 bg-accent-teal/10 text-accent-teal text-xs font-body rounded border border-accent-teal/30 text-center font-semibold">
                    This ticket has been marked resolved. If you have further issues, raise a new ticket.
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center space-y-3 py-16">
                <span className="text-5xl block animate-bounce">📬</span>
                <h3 className="text-xl font-heading text-ink font-bold">Select a Ticket</h3>
                <p className="text-sm font-body text-ink-muted max-w-xs leading-relaxed">Select a support ticket from the logs to view conversation thread.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </PageContainer>
  )
}

export default Tickets
