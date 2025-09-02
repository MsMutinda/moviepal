import { NextRequest } from "next/server"

import {
  clearRateLimitMap,
  createUserRateLimit,
  rateLimit,
} from "@/lib/utils/rate-limit"

describe("Rate Limit Utils", () => {
  beforeEach(() => {
    jest.clearAllMocks()
    clearRateLimitMap() // Clear the rate limit map before each test
  })

  describe("rateLimit", () => {
    it("should allow requests within limit", () => {
      const limiter = rateLimit({
        windowMs: 60000, // 1 minute
        maxRequests: 2,
      })

      const request = new NextRequest("http://localhost:3000/api/test", {
        headers: { "x-forwarded-for": "192.168.1.1" },
      })

      const result = limiter(request)
      expect(result.success).toBe(true)
      expect(result.limit).toBe(2)
      expect(result.remaining).toBe(1)
    })

    it("should block requests when limit exceeded", () => {
      const limiter = rateLimit({
        windowMs: 60000,
        maxRequests: 2,
      })

      const request = new NextRequest("http://localhost:3000/api/test", {
        headers: { "x-forwarded-for": "192.168.1.1" },
      })

      // First request
      limiter(request)
      // Second request
      limiter(request)
      // Third request should be blocked
      const result = limiter(request)

      expect(result.success).toBe(false)
      expect(result.limit).toBe(2)
      expect(result.remaining).toBe(0)
    })

    it("should reset after window expires", async () => {
      const limiter = rateLimit({
        windowMs: 100, // 100ms window
        maxRequests: 1,
      })

      const request = new NextRequest("http://localhost:3000/api/test", {
        headers: { "x-forwarded-for": "192.168.1.1" },
      })

      // First request should succeed
      const firstResult = limiter(request)
      expect(firstResult.success).toBe(true)
      expect(firstResult.remaining).toBe(0)

      // Second request should be blocked
      const secondResult = limiter(request)
      expect(secondResult.success).toBe(false)
      expect(secondResult.remaining).toBe(0)

      // Wait for window to expire and try again
      await new Promise((resolve) => setTimeout(resolve, 200)) // Wait longer than 100ms window
      const thirdResult = limiter(request)
      expect(thirdResult.success).toBe(true)
      expect(thirdResult.remaining).toBe(0)
    })

    it("should use custom key generator", () => {
      const limiter = rateLimit({
        windowMs: 60000,
        maxRequests: 5,
        keyGenerator: (request) => {
          const url = new URL(request.url)
          return `custom:${url.pathname}`
        },
      })

      const request = new NextRequest("http://localhost:3000/api/test")
      const result = limiter(request)

      expect(result.success).toBe(true)
      expect(result.limit).toBe(5)
      expect(result.remaining).toBe(4)
    })

    it("should handle different IP addresses separately", () => {
      const limiter = rateLimit({
        windowMs: 60000,
        maxRequests: 1,
      })

      const request1 = new NextRequest("http://localhost:3000/api/test", {
        headers: { "x-forwarded-for": "192.168.1.100" },
      })
      const request2 = new NextRequest("http://localhost:3000/api/test", {
        headers: { "x-forwarded-for": "192.168.1.200" },
      })

      const result1 = limiter(request1)
      const result2 = limiter(request2)

      expect(result1.success).toBe(true)
      expect(result2.success).toBe(true)
    })

    it("should handle unknown IP gracefully", () => {
      const limiter = rateLimit({
        windowMs: 60000,
        maxRequests: 1,
      })

      const request = new NextRequest("http://localhost:3000/api/test")
      const result = limiter(request)

      expect(result.success).toBe(true)
      expect(result.limit).toBe(1)
      expect(result.remaining).toBe(0)
    })
  })

  describe("createUserRateLimit", () => {
    it("should use user ID when available", () => {
      const limiter = createUserRateLimit(60000, 5)

      const request = new NextRequest("http://localhost:3000/api/test", {
        headers: {
          "x-forwarded-for": "192.168.1.1",
          "x-user-id": "user-123",
        },
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

    it("should handle different users separately", () => {
      const limiter = createUserRateLimit(60000, 1)

      const request1 = new NextRequest("http://localhost:3000/api/test", {
        headers: {
          "x-forwarded-for": "192.168.1.1",
          "x-user-id": "user-1",
        },
      })
      const request2 = new NextRequest("http://localhost:3000/api/test", {
        headers: {
          "x-forwarded-for": "192.168.1.1",
          "x-user-id": "user-2",
        },
      })

      const result1 = limiter(request1)
      const result2 = limiter(request2)

      expect(result1.success).toBe(true)
      expect(result2.success).toBe(true)
    })
  })
})
