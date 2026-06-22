import React, { useState, useEffect } from 'react'

interface ContactMessage {
  id: string
  name: string
  email: string
  subject: string
  message: string
  createdAt: string
}

export const ContactMessages: React.FC = () => {
  const [messages, setMessages] = useState<ContactMessage[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedMessage, setSelectedMessage] = useState<ContactMessage | null>(null)

  const fetchMessages = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/admin/contact-messages', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('admin_accessToken')}`
        }
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || 'Failed to fetch contact messages.')
      }
      const data = await res.json()
      setMessages(data)
    } catch (err: any) {
      setError(err.message || 'Error loading contact messages.')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation() // Prevent opening modal
    if (!confirm('Are you sure you want to delete this message?')) return

    try {
      const res = await fetch(`/api/admin/contact-messages/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('admin_accessToken')}`
        }
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || 'Failed to delete message.')
      }
      setMessages(messages.filter(msg => msg.id !== id))
      if (selectedMessage?.id === id) {
        setSelectedMessage(null)
      }
    } catch (err: any) {
      alert(err.message || 'Error deleting message.')
    }
  }

  useEffect(() => {
    fetchMessages()
  }, [])

  const filteredMessages = messages.filter(msg => {
    const search = searchQuery.toLowerCase()
    return (
      msg.name.toLowerCase().includes(search) ||
      msg.email.toLowerCase().includes(search) ||
      msg.subject.toLowerCase().includes(search) ||
      msg.message.toLowerCase().includes(search)
    )
  })

  return (
    <div className="space-y-6 text-left">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-border pb-3">
        <div>
          <h2 className="text-xl font-heading font-extrabold text-ink">Customer Messages</h2>
          <p className="text-[11px] text-ink-muted leading-normal">
            Inspect, read, and manage contact form messages submitted from the public workshop storefront.
          </p>
        </div>
        <div className="mt-3 sm:mt-0 flex items-center space-x-2">
          <input
            type="text"
            placeholder="Search messages..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="px-3 py-1.5 bg-surface border border-border rounded text-xs focus:outline-none focus:border-primary placeholder-ink-muted/65 w-48 sm:w-64"
          />
          <button
            onClick={fetchMessages}
            className="bg-bg border border-border hover:bg-bg/40 text-ink text-xs font-semibold px-3 py-1.5 rounded focus:outline-none transition-colors"
          >
            🔄 Refresh
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-primary/10 border border-primary/25 p-3 rounded-lg text-primary text-xs font-semibold">
          ⚠️ {error}
        </div>
      )}

      {/* Messages List Table */}
      <div className="bg-surface border border-border rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="bg-bg border-b border-border text-[10px] text-ink-muted uppercase font-semibold">
                <th className="px-4 py-2.5">Name</th>
                <th className="px-4 py-2.5">Email Address</th>
                <th className="px-4 py-2.5">Subject</th>
                <th className="px-4 py-2.5">Message Snippet</th>
                <th className="px-4 py-2.5">Date</th>
                <th className="px-4 py-2.5 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-ink-muted italic">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary"></div>
                      <span>Fetching contact messages...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredMessages.length > 0 ? (
                filteredMessages.map((msg) => (
                  <tr
                    key={msg.id}
                    onClick={() => setSelectedMessage(msg)}
                    className="hover:bg-bg/30 cursor-pointer transition-colors"
                  >
                    <td className="px-4 py-3 font-bold text-ink whitespace-nowrap">{msg.name}</td>
                    <td className="px-4 py-3 font-mono text-ink-muted">{msg.email}</td>
                    <td className="px-4 py-3 font-semibold text-ink max-w-xs truncate">{msg.subject}</td>
                    <td className="px-4 py-3 text-ink-muted max-w-sm truncate">{msg.message}</td>
                    <td className="px-4 py-3 font-mono text-ink-muted whitespace-nowrap">
                      {new Date(msg.createdAt).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={(e) => handleDelete(msg.id, e)}
                        className="text-primary hover:text-primary-hover font-bold text-[10px] uppercase tracking-wider focus:outline-none"
                      >
                        🗑️ Delete
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-ink-muted italic">
                    No customer contact messages found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail Overlay Modal */}
      {selectedMessage && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/40" onClick={() => setSelectedMessage(null)} />
          <div className="bg-surface border border-border w-full max-w-lg rounded-lg shadow-xl overflow-hidden z-10 text-left animate-fade-in-up">
            <div className="bg-secondary py-4 px-5 text-white flex justify-between items-center">
              <h3 className="font-heading font-extrabold text-sm tracking-wide">📩 Contact Message Detail</h3>
              <button onClick={() => setSelectedMessage(null)} className="text-white hover:opacity-85 text-lg font-bold">
                &times;
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-4 border-b border-border/60 pb-3 text-xs">
                <div>
                  <span className="text-[10px] text-ink-muted uppercase font-semibold block">Sender Name</span>
                  <strong className="text-ink text-sm">{selectedMessage.name}</strong>
                </div>
                <div>
                  <span className="text-[10px] text-ink-muted uppercase font-semibold block">Email Address</span>
                  <strong className="font-mono text-ink text-sm">{selectedMessage.email}</strong>
                </div>
                <div>
                  <span className="text-[10px] text-ink-muted uppercase font-semibold block">Subject</span>
                  <span className="text-ink font-bold">{selectedMessage.subject}</span>
                </div>
                <div>
                  <span className="text-[10px] text-ink-muted uppercase font-semibold block">Submitted Date</span>
                  <span className="font-mono text-ink-muted">{new Date(selectedMessage.createdAt).toLocaleString()}</span>
                </div>
              </div>

              <div className="space-y-1">
                <span className="block text-[10px] text-ink-muted uppercase font-semibold">Message Content</span>
                <div className="bg-bg border border-border rounded-lg p-4 text-xs leading-relaxed text-ink font-body whitespace-pre-wrap max-h-60 overflow-y-auto">
                  {selectedMessage.message}
                </div>
              </div>

              <div className="flex justify-end space-x-2.5 border-t border-border pt-4 mt-2">
                <button
                  type="button"
                  onClick={(e) => handleDelete(selectedMessage.id, e as any)}
                  className="bg-primary hover:bg-primary-hover text-white text-xs font-bold px-4 py-2 rounded focus:outline-none transition-colors"
                >
                  Delete Message
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedMessage(null)}
                  className="bg-bg border border-border text-ink text-xs font-bold px-4 py-2 rounded focus:outline-none hover:bg-bg/40 transition-colors"
                >
                  Close Window
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ContactMessages
