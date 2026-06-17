import React, { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import AuthLayout from '../components/AuthLayout'

export const ResetPassword: React.FC = () => {
  const location = useLocation()
  const navigate = useNavigate()

  const defaultIdentifier = (location.state as { identifier?: string })?.identifier || ''

  const [emailOrPhone, setEmailOrPhone] = useState(defaultIdentifier)
  const [otp, setOtp] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isSuccess, setIsSuccess] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg(null)

    if (!emailOrPhone.trim() || !otp.trim() || !newPassword || !confirmPassword) {
      setErrorMsg('Please fill out all the fields.')
      return
    }

    if (newPassword !== confirmPassword) {
      setErrorMsg('Passwords do not match!')
      return
    }

    if (newPassword.length < 6) {
      setErrorMsg('Password must be at least 6 characters long.')
      return
    }

    setIsSubmitting(true)

    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          emailOrPhone: emailOrPhone.trim(),
          otp: otp.trim(),
          newPassword
        })
      })

      if (!res.ok) {
        const err = await res.json()
        setErrorMsg(err.error || 'Failed to reset password.')
        setIsSubmitting(false)
        return
      }

      setIsSuccess(true)
    } catch (err) {
      setErrorMsg('Failed to reset password. Server error.')
      setIsSubmitting(false)
    }
  }

  return (
    <AuthLayout
      title="Reset Password"
      subtitle={
        isSuccess
          ? 'Your password has been successfully updated.'
          : 'Create a new secure password for your cabin account.'
      }
    >
      {isSuccess ? (
        <div className="space-y-4 text-center">
          <div className="p-4 bg-accent-teal/10 text-accent-teal text-sm font-body font-semibold rounded-lg border border-accent-teal/30">
            Success: Password has been reset. You can now login.
          </div>
          <button
            onClick={() => navigate('/login')}
            className="w-full btn-primary bg-accent-yellow hover:bg-accent-yellow/95 text-ink font-heading font-bold py-2.5 px-4 rounded-md shadow-xs text-sm"
          >
            Go to Sign In
          </button>
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
              Email or Phone Number
            </label>
            <input
              type="text"
              required
              disabled={isSubmitting}
              placeholder="e.g. parent@example.com"
              value={emailOrPhone}
              onChange={(e) => setEmailOrPhone(e.target.value)}
              className="input-workshop disabled:opacity-50"
            />
          </div>

          <div>
            <label className="block text-xs font-heading font-bold text-ink mb-1">
              6-Digit Reset Code (OTP)
            </label>
            <input
              type="text"
              required
              maxLength={6}
              disabled={isSubmitting}
              placeholder="123456"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              className="input-workshop disabled:opacity-50 font-mono font-bold tracking-widest text-center"
            />
          </div>

          <div>
            <label className="block text-xs font-heading font-bold text-ink mb-1">
              New Password
            </label>
            <input
              type="password"
              required
              disabled={isSubmitting}
              placeholder="Min. 6 characters"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="input-workshop disabled:opacity-50"
            />
          </div>

          <div>
            <label className="block text-xs font-heading font-bold text-ink mb-1">
              Confirm New Password
            </label>
            <input
              type="password"
              required
              disabled={isSubmitting}
              placeholder="Confirm password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="input-workshop disabled:opacity-50"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full btn-primary bg-accent-yellow hover:bg-accent-yellow/95 disabled:bg-border disabled:text-ink-muted text-ink font-heading font-bold py-2.5 px-4 rounded-md shadow-xs text-sm mt-2 flex items-center justify-center space-x-2"
          >
            {isSubmitting && <span className="animate-spin mr-1">⌛</span>}
            <span>Update Password</span>
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

export default ResetPassword
