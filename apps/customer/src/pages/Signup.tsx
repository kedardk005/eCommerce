import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import AuthLayout from '../components/AuthLayout'

export const Signup: React.FC = () => {
  const navigate = useNavigate()

  // Input states
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg(null)

    if (!name || !email || !phone || !password) {
      setErrorMsg('Please fill out all the fields.')
      return
    }

    setIsSubmitting(true)
    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), email: email.trim(), phone: phone.trim(), password })
      })
      if (!res.ok) {
        const err = await res.json()
        setErrorMsg(err.error || 'Signup failed.')
        setIsSubmitting(false)
        return
      }
      alert('Account created successfully! Please sign in.')
      navigate('/login')
    } catch (err) {
      setErrorMsg('Signup failed. Server error.')
      setIsSubmitting(false)
    }
  }

  return (
    <AuthLayout
      title="Create Account"
      subtitle="Join the Toy-n-Joy family to start building your collection."
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-left">
        {errorMsg && (
          <div className="bg-primary/10 border border-primary/25 p-3 rounded-lg text-primary text-xs font-semibold">
            ⚠️ {errorMsg}
          </div>
        )}

        <div>
          <label className="block text-xs font-heading font-bold text-ink mb-1">
            Full Name
          </label>
          <input
            type="text"
            required
            disabled={isSubmitting}
            placeholder="John Doe"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="input-workshop disabled:opacity-50"
          />
        </div>

        <div>
          <label className="block text-xs font-heading font-bold text-ink mb-1">
            Email Address
          </label>
          <input
            type="email"
            required
            disabled={isSubmitting}
            placeholder="john@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="input-workshop disabled:opacity-50"
          />
        </div>

        <div>
          <label className="block text-xs font-heading font-bold text-ink mb-1">
            Phone Number
          </label>
          <input
            type="tel"
            required
            disabled={isSubmitting}
            placeholder="e.g. 9876543210"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="input-workshop disabled:opacity-50"
          />
        </div>

        <div>
          <label className="block text-xs font-heading font-bold text-ink mb-1">
            Password
          </label>
          <input
            type="password"
            required
            disabled={isSubmitting}
            placeholder="Min. 8 characters"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="input-workshop disabled:opacity-50"
          />
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full btn-primary bg-accent-yellow hover:bg-accent-yellow/95 disabled:bg-border disabled:text-ink-muted text-ink font-heading font-bold py-2.5 px-4 rounded-md shadow-xs text-sm mt-2 flex items-center justify-center space-x-2"
        >
          {isSubmitting && <span className="animate-spin mr-1">⌛</span>}
          <span>Create Account</span>
        </button>
      </form>

      <div className="pt-3 border-t border-border text-center text-xs font-body select-none">
        <p className="text-ink-muted">
          Already have an account?{' '}
          <Link to="/login" className="text-accent-blue font-bold hover:underline">
            Sign In
          </Link>
        </p>
      </div>
    </AuthLayout>
  )
}

export default Signup
