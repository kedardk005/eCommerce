import dotenv from 'dotenv'
import cors from 'cors'
import helmet from 'helmet'
import express from 'express'
import cookieParser from 'cookie-parser'
import { prisma } from './lib/prisma'
import { Role } from '@prisma/client'

dotenv.config()

// Startup check for required environment variables
const requiredEnvVars = [
  'DATABASE_URL',
  'DIRECT_URL',
  'JWT_ACCESS_SECRET',
  'JWT_REFRESH_SECRET',
  'R2_ACCOUNT_ID',
  'R2_ACCESS_KEY',
  'R2_SECRET_KEY',
  'R2_BUCKET',
  'R2_PUBLIC_URL',
  'BREVO_API_KEY',
  'BREVO_SENDER',
  'RAZORPAY_KEY_ID',
  'RAZORPAY_KEY_SECRET',
  'RAZORPAY_WEBHOOK_SECRET',
  'SHIPROCKET_EMAIL',
  'SHIPROCKET_PASSWORD'
]

const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar])
if (missingEnvVars.length > 0) {
  console.error(`[FATAL] Startup failed: Missing required environment variables: ${missingEnvVars.join(', ')}`)
  process.exit(1)
}

import authRouter from './routes/auth.routes'
import uploadRouter from './routes/upload.routes'
import catalogRouter from './routes/catalog.routes'
import adminCatalogRouter from './routes/adminCatalog.routes'
import adminCouponRouter from './routes/adminCoupon.routes'
import cartWishlistRouter from './routes/cartWishlist.routes'
import addressRouter from './routes/address.routes'
import orderRouter from './routes/order.routes'
import returnRouter from './routes/return.routes'
import supportRouter from './routes/support.routes'
import settingsRouter from './routes/settings.routes'
import bannerRouter from './routes/banner.routes'
import campaignRouter from './routes/campaign.routes'
import cmsRouter from './routes/cms.routes'
import financeRouter from './routes/finance.routes'
import accountsRouter, { setPasswordHandler } from './routes/account.routes'
import activityLogRouter from './routes/activityLog.routes'
import profileRouter from './routes/profile.routes'
import contactRouter from './routes/contact.routes'
import adminNotificationRouter from './routes/adminNotification.routes'
import { globalApiLimiter, adminApiLimiter } from './middleware/auth.middleware'

const app = express()
const PORT = process.env.PORT || 5000

// Configure CORS and secure HTTP headers via helmet
const isProd = process.env.NODE_ENV === 'production'
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim())
  : []

app.use(cors({
  origin: (origin, callback) => {
    if (!isProd) {
      return callback(null, true)
    }
    if (!origin) {
      return callback(null, true)
    }
    if (allowedOrigins.includes(origin)) {
      return callback(null, true)
    }
    return callback(new Error('Not allowed by CORS'))
  },
  credentials: true
}))

app.use(helmet({
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  },
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: []
    }
  }
}))

// Add JSON size limits to prevent body parser payload abuse
app.use(express.json({ limit: '1mb' }))
app.use(express.urlencoded({ limit: '1mb', extended: true }))
app.use(cookieParser())

// Mount rate limiters
app.use('/api/admin', adminApiLimiter)
app.use('/api', globalApiLimiter)

// Mount routes
app.use('/api/auth', authRouter)
app.use('/api/uploads', uploadRouter)
app.use('/api', catalogRouter)
app.use('/api/admin', adminCatalogRouter)
app.use('/api/admin/coupons', adminCouponRouter)
app.use('/api', cartWishlistRouter)
app.use('/api', addressRouter)
app.use('/api', orderRouter)
app.use('/api', returnRouter)
app.use('/api', supportRouter)
app.use('/api', settingsRouter)
app.use('/api', bannerRouter)
app.use('/api/admin/campaigns', campaignRouter)
app.use('/api', cmsRouter)
app.use('/api/admin/finance', financeRouter)
app.use('/api/admin/accounts', accountsRouter)
app.use('/api/admin/activity-logs', activityLogRouter)
app.use('/api', profileRouter)
app.use('/api', contactRouter)
app.use('/api/admin/notifications', adminNotificationRouter)
app.post('/api/auth/set-password', setPasswordHandler)


app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'Toy-n-Joy Backend'
  })
})

const server = app.listen(PORT, () => {
  console.log(`Backend server running on port ${PORT}`)
})

export { app, server }

