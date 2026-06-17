import React, { useState, useEffect, useRef } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import AuthLayout from '../components/AuthLayout'

export const VerifyOtp: React.FC = () => {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  // Retrieve details from redirect state
  const identifier = (location.state as { identifier?: string })?.identifier || 'your device'
  const from = (location.state as { from?: string })?.from || '/'

  // 6 digits of OTP
  const [otp, setOtp] = useState<string[]>(Array(6).fill(''))
  
  // Timer state
  const [secondsLeft, setSecondsLeft] = useState(60)

  // Focus elements references
  const inputsRef = useRef<(HTMLInputElement | null)[]>([])

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  // Countdown timer effect
  useEffect(() => {
    if (secondsLeft <= 0) return
    const timer = setInterval(() => {
      setSecondsLeft((prev) => prev - 1)
    }, 1000)
    return () => clearInterval(timer)
  }, [secondsLeft])

  const handleOtpChange = (value: string, index: number) => {
    const cleanVal = value.replace(/[^0-9]/g, '').slice(-1)
    
    const newOtp = [...otp]
    newOtp[index] = cleanVal
    setOtp(newOtp)

    // Move focus to next input box if input is entered
    if (cleanVal && index < 5) {
      inputsRef.current[index + 1]?.focus()
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === 'Backspace') {
      if (!otp[index] && index > 0) {
        // Clear previous cell and focus it
        const newOtp = [...otp]
        newOtp[index - 1] = ''
        setOtp(newOtp)
        inputsRef.current[index - 1]?.focus()
      } else {
        const newOtp = [...otp]
        newOtp[index] = ''
        setOtp(newOtp)
      }
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg(null)
    const code = otp.join('')
    if (code.length < 6) {
      setErrorMsg('Please enter all 6 digits.')
      return
    }

    setIsSubmitting(true)
    try {
      const res = await fetch('/api/auth/otp/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emailOrPhone: identifier, otp: code })
      })
      if (!res.ok) {
        const err = await res.json()
        setErrorMsg(err.error || 'Invalid OTP code.')
        setIsSubmitting(false)
        return
      }
      const data = await res.json()
      login(data.user, data.accessToken)
      navigate(from, { replace: true })
    } catch (err) {
      setErrorMsg('Failed to verify OTP. Server error.')
      setIsSubmitting(false)
    }
  }

  const handleResend = async (e: React.MouseEvent) => {
    e.preventDefault()
    setErrorMsg(null)
    setOtp(Array(6).fill(''))
    setSecondsLeft(60)
    inputsRef.current[0]?.focus()
    setIsSubmitting(true)
    try {
      const res = await fetch('/api/auth/otp/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emailOrPhone: identifier })
      })
      if (!res.ok) {
        const err = await res.json()
        setErrorMsg(err.error || 'Failed to resend OTP.')
        setIsSubmitting(false)
        return
      }
      alert('A new 6-digit OTP code has been sent!')
    } catch (err) {
      setErrorMsg('Failed to resend OTP. Server error.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <AuthLayout
      title="Verify Account"
      subtitle={`We have simulated sending a code to ${identifier}`}
    >
      <form onSubmit={handleSubmit} className="space-y-6 text-center">
        {errorMsg && (
          <div className="bg-primary/10 border border-primary/25 p-3 rounded-lg text-primary text-xs font-semibold text-left">
            ⚠️ {errorMsg}
          </div>
        )}

        {/* 6 Grid input boxes */}
        <div className="flex justify-between items-center gap-2 max-w-xs mx-auto">
          {otp.map((digit, index) => (
            <input
              key={index}
              ref={(el) => { inputsRef.current[index] = el }}
              type="text"
              inputMode="numeric"
              maxLength={1}
              disabled={isSubmitting}
              value={digit}
              onChange={(e) => handleOtpChange(e.target.value, index)}
              onKeyDown={(e) => handleKeyDown(e, index)}
              className="w-12 h-12 text-center text-xl font-heading font-bold focus:outline-none input-workshop p-0 disabled:opacity-50"
            />
          ))}
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full btn-primary bg-accent-yellow hover:bg-accent-yellow/95 disabled:bg-border disabled:text-ink-muted text-ink font-heading font-bold py-2.5 px-4 rounded-md shadow-xs text-sm flex items-center justify-center space-x-2"
        >
          {isSubmitting && <span className="animate-spin mr-1">⌛</span>}
          <span>Verify & Continue</span>
        </button>

        {/* Resend status & timer */}
        <div className="text-xs font-body text-ink-muted text-center select-none">
          {secondsLeft > 0 ? (
            <p>
              Didn't receive the code? Resend available in{' '}
              <strong className="text-ink font-bold">{secondsLeft} seconds</strong>
            </p>
          ) : (
            <button
              onClick={handleResend}
              className="text-accent-blue font-heading font-bold hover:underline"
            >
              Resend OTP Code
            </button>
          )}
        </div>
      </form>
    </AuthLayout>
  )
}

export default VerifyOtp
