import { NextRequest } from "next/server"

// in-memory rate limiting
const rateLimitMap = new Map<string, { count: number; resetTime: number }>()

// Function to clear the rate limit map (for testing)
export function clearRateLimitMap() {
  rateLimitMap.clear()
}

interface RateLimitOptions {
  windowMs: number // Time window in milliseconds
  maxRequests: number // Maximum requests per window
  keyGenerator?: (_request: NextRequest) => string // Custom key generator
}

export function rateLimit(options: RateLimitOptions) {
  const { windowMs, maxRequests, keyGenerator } = options

  return (
    request: NextRequest,
  ): {
    success: boolean
    limit: number
    remaining: number
    resetTime: number
  } => {
    const key = keyGenerator ? keyGenerator(request) : getDefaultKey(request)
    const now = Date.now()

    // clean up expired entries
    for (const [k, v] of rateLimitMap.entries()) {
      if (v.resetTime < now) {
        rateLimitMap.delete(k)
      }
    }

    const current = rateLimitMap.get(key)

    if (!current || current.resetTime < now) {
      // first request or window expired
      rateLimitMap.set(key, {
        count: 1,
        resetTime: now + windowMs,
      })

      return {
        success: true,
        limit: maxRequests,
        remaining: maxRequests - 1,
        resetTime: now + windowMs,
      }
    }

    if (current.count >= maxRequests) {
      return {
        success: false,
        limit: maxRequests,
        remaining: 0,
        resetTime: current.resetTime,
      }
    }

    current.count++
    rateLimitMap.set(key, current)

    return {
      success: true,
      limit: maxRequests,
      remaining: maxRequests - current.count,
      resetTime: current.resetTime,
    }
  }
}

function getDefaultKey(request: NextRequest): string {
  // use IP address as default key
  const forwarded = request.headers.get("x-forwarded-for")
  const ip = forwarded ? forwarded.split(",")[0] : "unknown"
  return ip
}

export function createUserRateLimit(windowMs: number, maxRequests: number) {
  return rateLimit({
    windowMs,
    maxRequests,
    keyGenerator: (request) => {
      const userId = request.headers.get("x-user-id")
      if (userId) {
        return `user:${userId}`
      }

      // fallback to IP
      const forwarded = request.headers.get("x-forwarded-for")
      const ip = forwarded ? forwarded.split(",")[0] : "unknown"
      return `ip:${ip}`
    },
  })
}
