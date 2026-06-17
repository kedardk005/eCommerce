import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import AuthLayout from '../components/AuthLayout'

export const ForgotPassword: React.FC = () => {
  const [email, setEmail] = useState('')
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim()) return

    setIsSubmitting(true)
    setErrorMsg(null)

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emailOrPhone: email.trim() })
      })

      if (!res.ok) {
        const err = await res.json()
        setErrorMsg(err.error || 'Failed to send reset link.')
        setIsSubmitting(false)
        return
      }

      setIsSubmitted(true)
    } catch (err) {
      setErrorMsg('Failed to request reset. Server error.')
      setIsSubmitting(false)
    }
  }

  return (
    <AuthLayout
      title="Recover Password"
      subtitle={
        isSubmitted
          ? 'Check your inbox for password recovery guidelines.'
          : 'Enter your account email to receive a password reset link.'
      }
    >
      {isSubmitted ? (
        <div className="space-y-6 text-center">
          <div className="p-4 bg-accent-teal/10 text-accent-teal text-sm font-body font-semibold rounded-lg border border-accent-teal/30">
            A password recovery code has been sent to <strong>{email}</strong> if it exists in our system.
          </div>

          <div className="space-y-3">
            <button
              onClick={() => navigate('/reset-password', { state: { identifier: email } })}
              className="w-full btn-primary bg-accent-blue hover:bg-accent-blue/90 text-white font-heading font-bold py-2.5 px-4 rounded-md shadow-xs"
            >
              Go to Enter Reset Code &rarr;
            </button>
            <Link
              to="/login"
              className="block text-xs font-heading font-bold text-ink-muted hover:underline pt-2 select-none"
            >
              Back to Sign In
            </Link>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4 text-left">
          {errorMsg && (
            <div className="bg-primary/10 border border-primary/25 p-3 rounded-lg text-primary text-xs font-semibold">
              ⚠️ {errorMsg}
            </div>
          )}

          <div>
            <label className="block text-xs font-heading font-bold text-ink mb-1">
              Email Address
            </label>
            <input
              type="email"
              required
              disabled={isSubmitting}
              placeholder="e.g. parent@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input-workshop disabled:opacity-50"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full btn-primary bg-accent-yellow hover:bg-accent-yellow/95 disabled:bg-border disabled:text-ink-muted text-ink font-heading font-bold py-2.5 px-4 rounded-md shadow-xs text-sm mt-2 flex items-center justify-center space-x-2"
          >
            {isSubmitting && <span className="animate-spin mr-1">⌛</span>}
            <span>Send Reset Code</span>
          </button>
          
          <div className="pt-3 border-t border-border text-center text-xs font-body select-none">
            <Link to="/login" className="text-accent-blue font-bold hover:underline">
              Back to Sign In
            </Link>
          </div>
        </form>
      )}
    </AuthLayout>
  )
}

export default ForgotPassword
