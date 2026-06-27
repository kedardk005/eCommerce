import { Router, Request, Response } from 'express'
import { z } from 'zod'
import jwt from 'jsonwebtoken'
import { prisma } from '../lib/prisma'
import { OtpService } from '../services/otp.service'
import { BrevoService } from '../services/brevo.service'
import { rateLimit, sessionBlacklist } from '../middleware/auth.middleware'
import { Role } from '@prisma/client'

const router = Router()

// JWT helper configurations
const ACCESS_TOKEN_EXPIRY = '15m'
const REFRESH_TOKEN_EXPIRY = '7d'
const REFRESH_COOKIE_MAX_AGE = 7 * 24 * 60 * 60 * 1000 // 7 days in ms

const getAccessSecret = () => process.env.JWT_ACCESS_SECRET || 'fallback-access-secret'
const getRefreshSecret = () => process.env.JWT_REFRESH_SECRET || 'fallback-refresh-secret'

// Validation Schemas
const signupSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters long'),
  email: z.string().email('Invalid email address'),
  phone: z.string().optional(),
  password: z.string().min(6, 'Password must be at least 6 characters long')
})

const loginSchema = z.object({
  emailOrPhone: z.string().min(1, 'Email or Phone is required'),
  password: z.string().min(1, 'Password is required')
})

const otpRequestSchema = z.object({
  emailOrPhone: z.string().min(1, 'Email or Phone is required')
})

const otpVerifySchema = z.object({
  emailOrPhone: z.string().min(1, 'Email or Phone is required'),
  otp: z.string().length(6, 'OTP must be exactly 6 digits')
})

const forgotPasswordSchema = z.object({
  emailOrPhone: z.string().min(1, 'Email or Phone is required')
})

const resetPasswordSchema = z.object({
  emailOrPhone: z.string().min(1, 'Email or Phone is required'),
  otp: z.string().length(6, 'OTP must be exactly 6 digits'),
  newPassword: z.string().min(6, 'Password must be at least 6 characters long')
})

/**
 * Generate Access and Refresh JWTs
 */
const generateTokens = (user: { id: string; role: Role }) => {
  const accessToken = jwt.sign(
    { id: user.id, role: user.role },
    getAccessSecret(),
    { expiresIn: ACCESS_TOKEN_EXPIRY }
  )
  const refreshToken = jwt.sign(
    { id: user.id },
    getRefreshSecret(),
    { expiresIn: REFRESH_TOKEN_EXPIRY }
  )
  return { accessToken, refreshToken }
}

/**
 * Find User Helper by Email or Phone
 */
const findUserByEmailOrPhone = async (emailOrPhone: string) => {
  return prisma.user.findFirst({
    where: {
      OR: [
        { email: emailOrPhone },
        { phone: emailOrPhone }
      ]
    }
  })
}

/**
 * POST /api/auth/signup
 */
router.post('/signup', rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: 'Too many signup attempts. Please try again in 15 minutes.'
}), async (req: Request, res: Response) => {
  try {
    const data = signupSchema.parse(req.body)

    // Check if user already exists
    const existingUser = await findUserByEmailOrPhone(data.email)
    if (existingUser) {
      return res.status(400).json({ error: 'User with this email already exists' })
    }

    if (data.phone) {
      const existingPhone = await findUserByEmailOrPhone(data.phone)
      if (existingPhone) {
        return res.status(400).json({ error: 'User with this phone number already exists' })
      }
    }

    // Hash password
    const passwordHash = await OtpService.hashPassword(data.password)

    // Create user
    const newUser = await prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        phone: data.phone || null,
        passwordHash,
        role: Role.customer,
        emailVerified: false // Unverified until OTP verification
      }
    })

    return res.status(201).json({
      status: 'success',
      message: 'Signup successful! Please request an OTP to verify your account.'
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.issues[0]?.message || 'Validation error' })
    }
    console.error('Signup Error:', error)
    return res.status(500).json({ error: 'Internal Server Error' })
  }
})

/**
 * POST /api/auth/login
 * Rate limited to 10 requests per 15 minutes window
 */
router.post('/login', rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: 'Too many login attempts. Please try again in 15 minutes.'
}), async (req: Request, res: Response) => {
  try {
    const data = loginSchema.parse(req.body)

    const user = await findUserByEmailOrPhone(data.emailOrPhone)
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' })
    }

    if (user.isBlocked) {
      return res.status(403).json({ error: 'Your account has been suspended.' })
    }

    // Verify password
    const isPasswordValid = await OtpService.verifyPassword(data.password, user.passwordHash)
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid credentials' })
    }

    // Generate tokens
    const { accessToken, refreshToken } = generateTokens(user)

    // Set refresh token in httpOnly cookie
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: REFRESH_COOKIE_MAX_AGE
    })

    // Clear session blacklist for this user ID on new login
    sessionBlacklist.delete(user.id)

    // Send email alert for administrative logins
    if (user.role === Role.super_owner || user.role === Role.sub_admin) {
      BrevoService.sendAdminLoginAlert(user.id, user.email).catch(err => {
        console.error('Failed to send admin login alert email:', err)
      })
    }

    return res.json({
      accessToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.issues[0]?.message || 'Validation error' })
    }
    console.error('Login Error:', error)
    return res.status(500).json({ error: 'Internal Server Error' })
  }
})

/**
 * GET /api/auth/logout-session
 * Terminate/invalidate an admin session via the email link
 */
router.get('/logout-session', async (req: Request, res: Response) => {
  const userId = req.query.userId as string
  if (!userId) {
    return res.status(400).send('<h1>Error</h1><p>Missing user ID</p>')
  }

  // Blacklist the user session immediately
  sessionBlacklist.add(userId)

  return res.send(`
    <div style="font-family: sans-serif; max-width: 500px; margin: 50px auto; padding: 30px; border: 1px solid #EAE3D5; border-radius: 12px; text-align: center; background-color: #FDFBF7;">
      <h2 style="color: #FF5C4D;">Session Terminated</h2>
      <p style="color: #20212B; line-height: 1.6;">The administrator session for this account has been successfully terminated and logged out.</p>
      <p style="color: #767685; font-size: 14px;">Any ongoing actions using this session will be blocked immediately.</p>
    </div>
  `)
})

/**
 * POST /api/auth/otp/request
 * Rate limited to 5 requests per 10 minutes window
 */
router.post('/otp/request', rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 5,
  message: 'Too many OTP requests. Please try again in 10 minutes.'
}), async (req: Request, res: Response) => {
  try {
    const data = otpRequestSchema.parse(req.body)

    const user = await findUserByEmailOrPhone(data.emailOrPhone)
    if (!user) {
      return res.status(404).json({ error: 'Account not found' })
    }

    // Generate 6-digit OTP code
    const otp = OtpService.generateOtp()
    const otpHash = await OtpService.hashOtp(otp)
    const otpExpiry = new Date(Date.now() + 5 * 60 * 1000) // 5 minutes expiry

    // Save hashed OTP & expiry to DB
    await prisma.user.update({
      where: { id: user.id },
      data: {
        otpHash,
        otpExpiry
      }
    })

    // Send the OTP via Brevo
    const emailSent = await BrevoService.sendOtpEmail(user.email, otp)
    if (!emailSent) {
      return res.status(500).json({ error: 'Failed to send OTP verification email.' })
    }

    return res.json({
      status: 'success',
      message: 'Verification OTP code sent successfully.'
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.issues[0]?.message || 'Validation error' })
    }
    console.error('OTP Request Error:', error)
    return res.status(500).json({ error: 'Internal Server Error' })
  }
})

/**
 * POST /api/auth/otp/verify
 */
router.post('/otp/verify', rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 10,
  message: 'Too many OTP verification attempts. Please try again in 10 minutes.'
}), async (req: Request, res: Response) => {
  try {
    const data = otpVerifySchema.parse(req.body)

    const user = await findUserByEmailOrPhone(data.emailOrPhone)
    if (!user || !user.otpHash || !user.otpExpiry) {
      return res.status(400).json({ error: 'Invalid or missing OTP transaction' })
    }

    // Check expiry
    if (new Date() > user.otpExpiry) {
      return res.status(400).json({ error: 'OTP has expired. Please request a new one.' })
    }

    // Verify OTP code
    const isOtpValid = await OtpService.verifyOtp(data.otp, user.otpHash)
    if (!isOtpValid) {
      return res.status(400).json({ error: 'Invalid verification code' })
    }

    // Mark email verified & Clear OTP fields
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: true,
        otpHash: null,
        otpExpiry: null
      }
    })

    // Generate session tokens
    const { accessToken, refreshToken } = generateTokens(updatedUser)

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: REFRESH_COOKIE_MAX_AGE
    })

    return res.json({
      accessToken,
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role
      }
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.issues[0]?.message || 'Validation error' })
    }
    console.error('OTP Verification Error:', error)
    return res.status(500).json({ error: 'Internal Server Error' })
  }
})

/**
 * POST /api/auth/refresh
 */
router.post('/refresh', rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  message: 'Too many token refresh requests. Please try again in 15 minutes.'
}), async (req: Request, res: Response) => {
  const refreshToken = req.cookies?.refreshToken
  if (!refreshToken) {
    return res.status(401).json({ error: 'Refresh token missing. Please login again.' })
  }

  try {
    const decoded = jwt.verify(refreshToken, getRefreshSecret()) as { id: string }
    
    const user = await prisma.user.findUnique({
      where: { id: decoded.id }
    })

    if (!user) {
      return res.status(401).json({ error: 'User no longer exists' })
    }

    if (user.isBlocked) {
      return res.status(403).json({ error: 'Your account has been suspended.' })
    }

    // Generate new access token
    const accessToken = jwt.sign(
      { id: user.id, role: user.role },
      getAccessSecret(),
      { expiresIn: ACCESS_TOKEN_EXPIRY }
    )

    return res.json({ accessToken })
  } catch (error) {
    return res.status(401).json({ error: 'Invalid or expired refresh token. Please login again.' })
  }
})

/**
 * POST /api/auth/logout
 */
router.post('/logout', rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  message: 'Too many logout requests. Please try again in 15 minutes.'
}), (req: Request, res: Response) => {
  res.clearCookie('refreshToken', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict'
  })
  return res.json({ status: 'success', message: 'Logged out successfully' })
})

/**
 * POST /api/auth/forgot-password
 */
router.post('/forgot-password', rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: 'Too many forgot password attempts. Please try again in 15 minutes.'
}), async (req: Request, res: Response) => {
  try {
    const data = forgotPasswordSchema.parse(req.body)

    const user = await findUserByEmailOrPhone(data.emailOrPhone)
    if (!user) {
      // Return generic success to prevent email enumeration attacks
      return res.json({
        status: 'success',
        message: 'If an account with that email/phone exists, a password reset OTP has been sent.'
      })
    }

    // Generate Reset OTP
    const otp = OtpService.generateOtp()
    const otpHash = await OtpService.hashOtp(otp)
    const otpExpiry = new Date(Date.now() + 5 * 60 * 1000)

    await prisma.user.update({
      where: { id: user.id },
      data: {
        otpHash,
        otpExpiry
      }
    })

    // Send email
    const emailSent = await BrevoService.sendOtpEmail(user.email, otp)
    if (!emailSent) {
      console.error('[ForgotPassword] Failed to send OTP email to:', user.email)
    }

    return res.json({
      status: 'success',
      message: 'If an account with that email/phone exists, a password reset OTP has been sent.'
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.issues[0]?.message || 'Validation error' })
    }
    console.error('Forgot Password Error:', error)
    return res.status(500).json({ error: 'Internal Server Error' })
  }
})

/**
 * POST /api/auth/reset-password
 */
router.post('/reset-password', rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: 'Too many password reset attempts. Please try again in 15 minutes.'
}), async (req: Request, res: Response) => {
  try {
    const data = resetPasswordSchema.parse(req.body)

    const user = await findUserByEmailOrPhone(data.emailOrPhone)
    if (!user || !user.otpHash || !user.otpExpiry) {
      return res.status(400).json({ error: 'Invalid or missing OTP transaction' })
    }

    if (new Date() > user.otpExpiry) {
      return res.status(400).json({ error: 'OTP has expired. Please request a new one.' })
    }

    // Verify OTP code
    const isOtpValid = await OtpService.verifyOtp(data.otp, user.otpHash)
    if (!isOtpValid) {
      return res.status(400).json({ error: 'Invalid verification code' })
    }

    // Hash new password
    const passwordHash = await OtpService.hashPassword(data.newPassword)

    // Save and clear OTP
    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        otpHash: null,
        otpExpiry: null
      }
    })

    return res.json({
      status: 'success',
      message: 'Password reset successful! You can now login with your new password.'
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.issues[0]?.message || 'Validation error' })
    }
    console.error('Reset Password Error:', error)
    return res.status(500).json({ error: 'Internal Server Error' })
  }
})

export default router
