import React, { useState } from 'react'
import PageContainer from '../components/PageContainer'

export const Contact: React.FC = () => {
  const [formSubmitted, setFormSubmitted] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          subject: formData.subject,
          message: formData.message
        })
      })

      if (res.ok) {
        setFormSubmitted(true)
        setFormData({ name: '', email: '', subject: '', message: '' })
      } else {
        const errData = await res.json().catch(() => ({}))
        alert(errData.error || 'Failed to send message. Please try again.')
      }
    } catch (err) {
      alert('Network error. Failed to connect to server.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <PageContainer className="py-16 space-y-16 text-left animate-fade-in">
      {/* Page Header */}
      <div className="max-w-2xl space-y-3">
        <h1 className="text-4xl font-heading font-extrabold text-ink tracking-tight">Contact Our Workshop</h1>
        <p className="text-base text-ink-muted leading-relaxed font-body">
          Have a question about our wood materials, order status, or looking for custom engraving? Drop us a line and our toy cabin hosts will get back to you shortly.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
        {/* Contact Form card (7 cols) */}
        <div className="lg:col-span-7 bg-white border border-border rounded-2xl p-6 sm:p-10 shadow-xs space-y-6">
          <h2 className="text-2xl font-heading font-bold text-ink">Send a Message</h2>
          
          {formSubmitted ? (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-6 rounded-xl space-y-3">
              <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 6 9 17l-5-5" />
                </svg>
              </div>
              <h3 className="text-base font-heading font-bold">Message Sent Successfully!</h3>
              <p className="text-sm font-body text-emerald-900/80 leading-relaxed">
                Thank you for reaching out. We have logged your request and our customer hosts will respond via email within 24 hours.
              </p>
              <button
                onClick={() => setFormSubmitted(false)}
                className="mt-2 text-xs font-heading font-bold uppercase tracking-wider text-emerald-700 hover:text-emerald-900 transition-colors"
              >
                Send Another Message
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label htmlFor="contact-name" className="text-xs font-heading font-bold text-ink-muted uppercase tracking-wider">Your Name</label>
                  <input
                    id="contact-name"
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Aarav Sharma"
                    className="input-workshop"
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="contact-email" className="text-xs font-heading font-bold text-ink-muted uppercase tracking-wider">Email Address</label>
                  <input
                    id="contact-email"
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="name@example.com"
                    className="input-workshop"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="contact-subject" className="text-xs font-heading font-bold text-ink-muted uppercase tracking-wider">Subject</label>
                <input
                  id="contact-subject"
                  type="text"
                  required
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  placeholder="e.g. Shipping inquiry / custom engraving query"
                  className="input-workshop"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="contact-message" className="text-xs font-heading font-bold text-ink-muted uppercase tracking-wider">Message</label>
                <textarea
                  id="contact-message"
                  required
                  rows={5}
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  placeholder="Write your message detail here..."
                  className="input-workshop resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full sm:w-auto px-8 py-3 uppercase tracking-wider text-xs font-heading font-bold"
              >
                {loading ? 'Sending Request...' : 'Send Message'}
              </button>
            </form>
          )}
        </div>

        {/* Quick Contacts Panel (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Support Channels */}
          <div className="bg-surface border border-border rounded-2xl p-6 sm:p-8 space-y-6">
            <h2 className="text-xl font-heading font-bold text-ink">Workshop Channels</h2>
            
            <div className="space-y-4">
              {/* WhatsApp Option */}
              <a
                href="https://wa.me/919999999999?text=Hello%20Toy%20Cabin,%20I%20have%20an%20inquiry%20regarding%20wooden%20toys."
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-4 p-3 bg-emerald-50/50 hover:bg-emerald-50 border border-emerald-100 rounded-xl transition duration-150 group"
              >
                <div className="w-10 h-10 bg-emerald-500 rounded-lg flex items-center justify-center text-white shrink-0 shadow-xs">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-sm font-heading font-bold text-ink group-hover:text-emerald-600 transition-colors">WhatsApp Chat</h3>
                  <p className="text-xs text-ink-muted font-body leading-relaxed">+91 99999 99999</p>
                </div>
              </a>

              {/* Email Option */}
              <div className="flex items-center gap-4 p-3 bg-primary-hover/5 hover:bg-primary-hover/10 border border-primary/10 rounded-xl transition duration-150">
                <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center text-white shrink-0 shadow-xs">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect width="20" height="16" x="2" y="4" rx="2" />
                    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-sm font-heading font-bold text-ink">Support Email</h3>
                  <p className="text-xs text-ink-muted font-body leading-relaxed">support@toycabin.in</p>
                </div>
              </div>

              {/* Call Option */}
              <div className="flex items-center gap-4 p-3 bg-secondary/5 hover:bg-secondary/10 border border-secondary/10 rounded-xl transition duration-150">
                <div className="w-10 h-10 bg-secondary rounded-lg flex items-center justify-center text-white shrink-0 shadow-xs">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-sm font-heading font-bold text-ink">Hotline</h3>
                  <p className="text-xs text-ink-muted font-body leading-relaxed">1800-123-TOYS (Mon-Sat, 9AM-6PM)</p>
                </div>
              </div>
            </div>
          </div>

          {/* Styled Google Maps Placeholder Card */}
          <div className="bg-white border border-border rounded-2xl p-4 shadow-2xs space-y-4">
            <div className="relative aspect-[16/9] w-full bg-gradient-to-br from-slate-100 to-slate-200 rounded-xl overflow-hidden flex flex-col items-center justify-center border border-border/60">
              <div className="absolute inset-0 opacity-10 pointer-events-none bg-[radial-gradient(#20212b_1px,transparent_1px)] [background-size:16px_16px]"></div>
              
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center text-primary animate-bounce">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
              </div>
              <span className="text-xs font-heading font-bold text-ink mt-2">Toy Cabin Craft Workshop</span>
              <span className="text-[10px] text-ink-muted font-body">Sector 62, Noida, UP, India</span>
            </div>
            
            <div className="px-2 text-xs text-ink-muted font-body leading-relaxed">
              <strong>Visit Us:</strong> Visitors are welcome to view our carving workshop by prior appointment.
            </div>
          </div>

        </div>
      </div>
    </PageContainer>
  )
}

export default Contact
