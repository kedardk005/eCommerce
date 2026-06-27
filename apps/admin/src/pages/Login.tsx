import React, { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAdminAuth } from '../context/AdminAuthContext'

export const Login: React.FC = () => {
  const { login, isLoggedIn } = useAdminAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const [email, setEmail] = useState('toynjoy.online@gmail.com')
  const [password, setPassword] = useState('toynjoy@#')
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  // Get destination path from state (if redirected by RequireRole)
  const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/'

  // If already logged in, redirect away
  React.useEffect(() => {
    if (isLoggedIn) {
      navigate(from, { replace: true })
    }
  }, [isLoggedIn, navigate, from])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!email.trim() || !password.trim()) {
      setErrorMsg('Please enter both email and password.')
      return
    }

    try {
      setErrorMsg(null)
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          emailOrPhone: email.trim(),
          password: password.trim()
        })
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Invalid admin credentials')
      }

      const data = await res.json()
      
      if (data.user.role !== 'super_owner' && data.user.role !== 'sub_admin') {
        throw new Error('Access denied. You do not have administrative roles.')
      }

      localStorage.setItem('admin_accessToken', data.accessToken)
      login(data.user.role, data.user.name, data.user.email)
      navigate(from, { replace: true })
    } catch (err: any) {
      setErrorMsg(err.message || 'Authentication error')
    }
  }

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-surface border border-border rounded-lg shadow-md overflow-hidden">
        {/* Top Header Motif */}
        <div className="bg-secondary py-6 px-8 text-center border-b border-border">
          <div className="text-3xl mb-1 select-none">🪵</div>
          <h1 className="font-heading font-extrabold text-xl text-white tracking-wide">
            Toy-n-Joy Control Center
          </h1>
          <p className="text-[10px] font-heading font-bold text-accent-yellow/80 uppercase tracking-widest mt-1">
            Administrative Console
          </p>
        </div>

        {/* Form Container */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errorMsg && (
            <div className="bg-primary/10 border border-primary/20 text-primary text-xs px-3 py-2 rounded text-left">
              {errorMsg}
            </div>
          )}

          {/* Email Input */}
          <div className="space-y-1 text-left">
            <label className="block text-xs font-semibold text-ink">
              Admin Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 bg-bg border border-border rounded text-xs focus:outline-none focus:border-primary"
              placeholder="e.g. admin@toystore.com"
              required
            />
          </div>

          {/* Password Input */}
          <div className="space-y-1 text-left">
            <label className="block text-xs font-semibold text-ink">
              Console Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 bg-bg border border-border rounded text-xs focus:outline-none focus:border-primary"
              placeholder="Password"
              required
            />
          </div>



          {/* Sign In Button */}
          <button
            type="submit"
            className="w-full mt-2 bg-primary hover:bg-primary-hover text-white font-heading font-bold text-xs py-2.5 px-4 rounded transition-colors shadow-sm focus:outline-none"
          >
            Authenticate Console Session
          </button>
        </form>

        {/* Footer */}
        <div className="bg-bg/50 border-t border-border py-4 px-6 text-center text-[10px] text-ink-muted">
          Authorized personnel access only. Actions within this session are logged.
        </div>
      </div>
    </div>
  )
}

export default Login
