import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'

export const SetPassword: React.FC = () => {
  const navigate = useNavigate()
  const token = new URLSearchParams(window.location.search).get('token')

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!token) {
      setErrorMsg('Invalid or missing invitation token.')
      return
    }

    if (password.length < 6) {
      setErrorMsg('Password must be at least 6 characters long.')
      return
    }

    if (password !== confirmPassword) {
      setErrorMsg('Passwords do not match.')
      return
    }

    setIsSubmitting(true)
    setErrorMsg(null)

    try {
      const res = await fetch('/api/auth/set-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ token, password })
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Failed to set password. Link may be expired.')
      }

      setSuccessMsg('Your staff account password has been successfully configured. You can now log in.')
    } catch (err: any) {
      setErrorMsg(err.message || 'An error occurred.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-surface border border-border rounded-lg shadow-md overflow-hidden">
        {/* Top Header Motif */}
        <div className="bg-secondary py-6 px-8 text-center border-b border-border">
          <div className="text-3xl mb-1 select-none">🔑</div>
          <h1 className="font-heading font-extrabold text-xl text-white tracking-wide">
            Account Setup
          </h1>
          <p className="text-[10px] font-heading font-bold text-accent-yellow/80 uppercase tracking-widest mt-1">
            Set Your Staff Password
          </p>
        </div>

        {/* Content Area */}
        <div className="p-6">
          {successMsg ? (
            <div className="space-y-4 text-center">
              <div className="bg-accent-teal/10 border border-accent-teal/20 text-accent-teal text-xs px-3 py-3 rounded text-left leading-relaxed">
                {successMsg}
              </div>
              <button
                onClick={() => navigate('/login')}
                className="w-full bg-primary hover:bg-primary-hover text-white font-heading font-bold text-xs py-2.5 px-4 rounded transition-colors shadow-sm focus:outline-none"
              >
                Proceed to Login
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {errorMsg && (
                <div className="bg-primary/10 border border-primary/20 text-primary text-xs px-3 py-2 rounded text-left">
                  {errorMsg}
                </div>
              )}

              {!token && (
                <div className="bg-primary/10 border border-primary/20 text-primary text-xs px-3 py-2 rounded text-left">
                  Warning: No invitation token was detected in the URL. You will not be able to set a password.
                </div>
              )}

              {/* Password Input */}
              <div className="space-y-1 text-left">
                <label className="block text-xs font-semibold text-ink">
                  Enter Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 py-2 bg-bg border border-border rounded text-xs focus:outline-none focus:border-primary"
                  placeholder="At least 6 characters"
                  required
                  disabled={!token || isSubmitting}
                />
              </div>

              {/* Confirm Password Input */}
              <div className="space-y-1 text-left">
                <label className="block text-xs font-semibold text-ink">
                  Confirm Password
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-3 py-2 bg-bg border border-border rounded text-xs focus:outline-none focus:border-primary"
                  placeholder="Repeat your password"
                  required
                  disabled={!token || isSubmitting}
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={!token || isSubmitting}
                className="w-full mt-2 bg-primary hover:bg-primary-hover text-white font-heading font-bold text-xs py-2.5 px-4 rounded transition-colors shadow-sm focus:outline-none disabled:opacity-50"
              >
                {isSubmitting ? 'Configuring Account...' : 'Confirm and Set Password'}
              </button>
            </form>
          )}
        </div>

        {/* Footer */}
        <div className="bg-bg/50 border-t border-border py-4 px-6 text-center text-[10px] text-ink-muted">
          Link is valid for 24 hours. For security reasons, please do not share this URL.
        </div>
      </div>
    </div>
  )
}

export default SetPassword
