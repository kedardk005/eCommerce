import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { Role } from '@prisma/client'
import LRU from 'lru-cache'

// Extend express Request to support custom user context compile-safely
export interface AuthenticatedRequest extends Request {
  user?: {
    id: string
    role: Role
  }
}

/**
 * Require valid JWT access token in Authorization header
 */
export const requireAuth = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required. Missing token.' })
  }

  const token = authHeader.split(' ')[1]
  const secret = process.env.JWT_ACCESS_SECRET || 'fallback-access-secret'

  try {
    const decoded = jwt.verify(token, secret) as { id: string; role: Role }
    req.user = {
      id: decoded.id,
      role: decoded.role
    }
    next()
  } catch (error) {
    return res.status(401).json({ error: 'Authentication failed. Invalid or expired token.' })
  }
}

/**
 * Restrict endpoint access to specific roles
 */
export const requireRole = (...allowedRoles: Role[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required.' })
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Access denied. Insufficient permissions.' })
    }

    next()
  }
}

// In-memory store for rate limiting using LRU Cache to bound memory size
interface RateLimitRecord {
  count: number
  resetTime: number
}

const rateLimitCache = new LRU<string, RateLimitRecord>({
  max: 10000, // Bound memory to maximum 10k unique IP + endpoint keys
  maxAge: 60 * 60 * 1000 // 1 hour key expiry limit
})

/**
 * In-memory rate limiting middleware using LRU Cache
 */
export const rateLimit = (options: { windowMs: number; max: number; message: string }) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const ip = (req.ip || req.socket.remoteAddress || 'unknown-ip').toString()
    // Identify by endpoint path + client IP
    const key = `${req.path}:${ip}`
    const now = Date.now()

    let record = rateLimitCache.get(key)

    if (!record || now > record.resetTime) {
      record = {
        count: 1,
        resetTime: now + options.windowMs
      }
      rateLimitCache.set(key, record)
      return next()
    }

    record.count++
    rateLimitCache.set(key, record)

    if (record.count > options.max) {
      res.setHeader('Retry-After', Math.ceil((record.resetTime - now) / 1000).toString())
      return res.status(429).json({
        error: options.message,
        retryAfterMs: record.resetTime - now
      })
    }

    next()
  }
}

/**
 * Global baseline rate limiter for customer-facing /api/* endpoints
 */
export const globalApiLimiter = (req: Request, res: Response, next: NextFunction) => {
  // Bypasses admin routes so we do not double rate-limit admin panels
  if (req.path.startsWith('/admin') || req.baseUrl.startsWith('/api/admin')) {
    return next()
  }
  return rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 300,
    message: 'Too many requests. Please try again later.'
  })(req, res, next)
}

/**
 * Separate generous rate limiter for admin-facing /api/admin/* endpoints
 */
export const adminApiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  message: 'Too many administrative requests. Please try again later.'
})
