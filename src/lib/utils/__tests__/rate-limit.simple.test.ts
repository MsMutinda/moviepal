import { NextRequest } from "next/server"

import { createUserRateLimit, rateLimit } from "@/lib/utils/rate-limit"

describe("Rate Limit Utils - Simple Tests", () => {
  describe("rateLimit", () => {
    it("should allow requests within limit", () => {
      const limiter = rateLimit({
        windowMs: 60000, // 1 minute
        maxRequests: 5,
      })

      const request = new NextRequest("http://localhost:3000/api/test", {
        headers: { "x-forwarded-for": "192.168.1.1" },
      })

      const result = limiter(request)

      expect(result.success).toBe(true)
      expect(result.limit).toBe(5)
      expect(result.remaining).toBe(4)
      expect(result.resetTime).toBeGreaterThan(Date.now())
    })

    it("should block requests when limit exceeded", () => {
      const limiter = rateLimit({
        windowMs: 60000, // 1 minute
        maxRequests: 2,
      })

      const request = new NextRequest("http://localhost:3000/api/test", {
        headers: { "x-forwarded-for": "192.168.1.1" },
      })

      // Make requests up to the limit
      limiter(request)
      limiter(request)
      const result = limiter(request) // This should be blocked

      expect(result.success).toBe(false)
      expect(result.limit).toBe(2)
      expect(result.remaining).toBe(0)
    })

    it("should use custom key generator", () => {
      const limiter = rateLimit({
        windowMs: 60000,
        maxRequests: 5,
        keyGenerator: (request) => {
          return `custom:${request.url}`
        },
      })

      const request = new NextRequest("http://localhost:3000/api/test")
      const result = limiter(request)

      expect(result.success).toBe(true)
    })

    it("should handle unknown IP gracefully", () => {
      const limiter = rateLimit({
        windowMs: 60000,
        maxRequests: 5,
      })

      const request = new NextRequest("http://localhost:3000/api/test")
      const result = limiter(request)

      expect(result.success).toBe(true)
      expect(result.limit).toBe(5)
      expect(result.remaining).toBe(4)
    })
  })

  describe("createUserRateLimit", () => {
    it("should use user ID when available", () => {
      const limiter = createUserRateLimit(60000, 5)

      const request = new NextRequest("http://localhost:3000/api/test", {
        headers: { "x-user-id": "user123" },
      })

      const result = limiter(request)

      expect(result.success).toBe(true)
      expect(result.limit).toBe(5)
      expect(result.remaining).toBe(4)
    })

    it("should fallback to IP when user ID not available", () => {
      const limiter = createUserRateLimit(60000, 5)

      const request = new NextRequest("http://localhost:3000/api/test", {
        headers: { "x-forwarded-for": "192.168.1.1" },
      })

      const result = limiter(request)

      expect(result.success).toBe(true)
      expect(result.limit).toBe(5)
      expect(result.remaining).toBe(4)
    })
  })
})
