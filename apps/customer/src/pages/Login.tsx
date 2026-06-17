import React, { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import AuthLayout from '../components/AuthLayout'

export const Login: React.FC = () => {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  // Routing navigation target
  const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/'

  // Toggle state for Login mode
  const [loginWithOtp, setLoginWithOtp] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  // Fields state
  const [identifier, setIdentifier] = useState('') // email or phone
  const [password, setPassword] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg(null)

    if (!identifier.trim()) {
      setErrorMsg('Please fill out the email or phone field.')
      return
    }

    setIsSubmitting(true)
    if (loginWithOtp) {
      try {
        const res = await fetch('/api/auth/otp/request', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ emailOrPhone: identifier.trim() })
        })
        if (!res.ok) {
          const err = await res.json()
          setErrorMsg(err.error || 'Failed to request OTP.')
          setIsSubmitting(false)
          return
        }
        // Navigate to OTP verification page, passing the identifier in the route state
        navigate('/verify-otp', { state: { identifier: identifier.trim(), from } })
      } catch (err) {
        setErrorMsg('Failed to request OTP. Server error.')
        setIsSubmitting(false)
      }
    } else {
      if (!password.trim()) {
        setErrorMsg('Please fill out the password field.')
        setIsSubmitting(false)
        return
      }
      try {
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ emailOrPhone: identifier.trim(), password: password.trim() })
        })
        if (!res.ok) {
          const err = await res.json()
          setErrorMsg(err.error || 'Invalid credentials.')
          setIsSubmitting(false)
          return
        }
        const data = await res.json()
        login(data.user, data.accessToken)
        navigate(from, { replace: true })
      } catch (err) {
        setErrorMsg('Failed to sign in. Server error.')
        setIsSubmitting(false)
      }
    }
  }

  return (
    <AuthLayout
      title={loginWithOtp ? 'Login with OTP' : 'Sign In'}
      subtitle={
        loginWithOtp
          ? 'Enter your details to receive a 6-digit verification code.'
          : 'Enter your credentials to access your cabin account.'
      }
    >
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
            placeholder="e.g. customer@example.com or 9876543210"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            className="input-workshop disabled:opacity-50"
          />
        </div>

        {!loginWithOtp && (
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="block text-xs font-heading font-bold text-ink">
                Password
              </label>
              <Link
                to="/forgot-password"
                className="text-xs font-heading font-bold text-accent-blue hover:underline"
              >
                Forgot Password?
              </Link>
            </div>
            <input
              type="password"
              required
              disabled={isSubmitting}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input-workshop disabled:opacity-50"
            />
          </div>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full btn-primary bg-accent-yellow hover:bg-accent-yellow/95 disabled:bg-border disabled:text-ink-muted text-ink font-heading font-bold py-2.5 px-4 rounded-md shadow-xs text-sm mt-2 flex items-center justify-center space-x-2"
        >
          {isSubmitting && <span className="animate-spin mr-1">⌛</span>}
          <span>{loginWithOtp ? 'Send OTP' : 'Sign In'}</span>
        </button>
      </form>

      <div className="space-y-4 pt-3 border-t border-border text-center text-xs font-body">
        {/* Toggle Mode */}
        <button
          onClick={() => setLoginWithOtp(!loginWithOtp)}
          className="text-accent-blue hover:underline font-heading font-bold"
        >
          {loginWithOtp ? 'Use Email & Password instead' : 'Login with OTP instead'}
        </button>

        <p className="text-ink-muted select-none">
          Don't have an account?{' '}
          <Link to="/signup" className="text-accent-blue font-bold hover:underline">
            Create account
          </Link>
        </p>
      </div>
    </AuthLayout>
  )
}

export default Login
