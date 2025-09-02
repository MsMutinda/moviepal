import { NextRequest } from "next/server"

import { GET, POST } from "@/app/api/lists/[identifier]/items/route"

// Mock dependencies
jest.mock("@/lib/auth", () => ({
  auth: {
    api: {
      getSession: jest.fn(),
    },
  },
}))

jest.mock("@/lib/database/database", () => ({
  db: {
    select: jest.fn(),
    insert: jest.fn(),
  },
}))

jest.mock("@/services/tmdb.service", () => ({
  tmdbService: {
    getMovieDetails: jest.fn(),
  },
}))

// Import mocked modules
import { auth } from "@/lib/auth"
import { db } from "@/lib/database/database"
import { tmdbService } from "@/services/tmdb.service"

const mockAuth = auth as jest.Mocked<typeof auth>
const mockGetSession = mockAuth.api.getSession as jest.MockedFunction<
  typeof mockAuth.api.getSession
>
const mockDb = db as jest.Mocked<typeof db>
const mockTmdbService = tmdbService as jest.Mocked<typeof tmdbService>

// Helper function to create mock requests
const createMockRequest = (
  url: string,
  options: { method?: string; body?: unknown } = {},
) => {
  const { method = "GET", body } = options
  const request = new NextRequest(url, {
    method,
    body: body ? JSON.stringify(body) : undefined,
    headers: {
      "content-type": "application/json",
    },
  })
  return request
}

// Mock data
const mockSession = {
  session: {
    id: "session-123",
    userId: "user-123",
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    createdAt: new Date(),
    updatedAt: new Date(),
    token: "test-token",
    ipAddress: null,
    userAgent: null,
  },
  user: {
    id: "user-123",
    email: "test@example.com",
    emailVerified: true,
    name: "Test User",
    createdAt: new Date(),
    updatedAt: new Date(),
    image: null,
  },
}

const mockList = {
  id: "list-123",
  name: "Test List",
  description: "A test list",
  user_id: "user-123",
  is_public: false,
  created_at: new Date(),
  updated_at: new Date(),
}

const mockMovie = {
  id: "movie-123",
  tmdb_id: 12345,
  title: "Test Movie",
  overview: "A test movie",
  release_date: "2023-01-01",
  poster_path: "/test-poster.jpg",
  backdrop_path: "/test-backdrop.jpg",
  created_at: new Date(),
  updated_at: new Date(),
}

const _mockListItem = {
  id: "item-123",
  list_id: "list-123",
  movie_id: "movie-123",
  added_at: new Date(),
}

const mockTmdbMovie = {
  id: 12345,
  title: "Test Movie",
  overview: "A test movie",
  release_date: "2023-01-01",
  poster_path: "/test-poster.jpg",
  backdrop_path: "/test-backdrop.jpg",
  adult: false,
  genre_ids: [28, 12],
  original_language: "en",
  original_title: "Test Movie",
  popularity: 100,
  video: false,
  vote_average: 8.5,
  vote_count: 1000,
}

describe("/api/lists/[identifier]/items", () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe("GET", () => {
    it("should return 401 if user is not authenticated", async () => {
      mockGetSession.mockResolvedValue(null)

      const request = createMockRequest(
        "http://localhost:3000/api/lists/test-list/items",
      )
      const response = await GET(request, {
        params: Promise.resolve({ identifier: "test-list" }),
      })

      expect(response.status).toBe(401)
      const body = await response.json()
      expect(body).toEqual({ error: "Unauthorized" })
    })

    it("should return 404 if list is not found", async () => {
      mockGetSession.mockResolvedValue(mockSession)

      const mockSelect = jest.fn().mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([]),
          }),
        }),
      })

      mockDb.select.mockReturnValue(mockSelect() as never)

      const request = createMockRequest(
        "http://localhost:3000/api/lists/nonexistent/items",
      )
      const response = await GET(request, {
        params: Promise.resolve({ identifier: "nonexistent" }),
      })

      expect(response.status).toBe(404)
      const body = await response.json()
      expect(body).toEqual({ error: "List not found" })
    })

    it("should return list items with pagination", async () => {
      mockGetSession.mockResolvedValue(mockSession)

      // Mock list lookup
      const mockListSelect = jest.fn().mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([mockList]),
          }),
        }),
      })

      // Mock count query
      const mockCountSelect = jest.fn().mockReturnValue({
        from: jest.fn().mockReturnValue({
          innerJoin: jest.fn().mockReturnValue({
            where: jest
              .fn()
              .mockResolvedValue([
                { count: "movie-id-1" },
                { count: "movie-id-2" },
              ]),
          }),
        }),
      })

      // Mock items query
      const mockItemsSelect = jest.fn().mockReturnValue({
        from: jest.fn().mockReturnValue({
          innerJoin: jest.fn().mockReturnValue({
            where: jest.fn().mockReturnValue({
              orderBy: jest.fn().mockReturnValue({
                limit: jest.fn().mockReturnValue({
                  offset: jest.fn().mockResolvedValue([
                    {
                      id: "test-list-id",
                      movieId: "movie-id-1",
                      addedAt: new Date(),
                      movie: {
                        tmdbId: 12345,
                        title: "Test Movie",
                        year: 2023,
                        metadata: { poster_path: "/poster.jpg" },
                      },
                    },
                  ]),
                }),
              }),
            }),
          }),
        }),
      })

      mockDb.select
        .mockReturnValueOnce(mockListSelect() as never)
        .mockReturnValueOnce(mockCountSelect() as never)
        .mockReturnValueOnce(mockItemsSelect() as never)

      const request = createMockRequest(
        "http://localhost:3000/api/lists/test-list/items?page=1&limit=20",
      )
      const response = await GET(request, {
        params: Promise.resolve({ identifier: "test-list" }),
      })

      expect(response.status).toBe(200)
      const body = await response.json()
      expect(body).toHaveProperty("items")
      expect(body).toHaveProperty("pagination")
      expect(body.pagination).toEqual({
        page: 1,
        limit: 20,
        total: 2,
        totalPages: 1,
        hasNext: false,
        hasPrev: false,
      })
    })

    it("should handle search parameter", async () => {
      mockGetSession.mockResolvedValue(mockSession)

      // Mock list lookup
      const mockListSelect = jest.fn().mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([mockList]),
          }),
        }),
      })

      // Mock count query with search
      const mockCountSelect = jest.fn().mockReturnValue({
        from: jest.fn().mockReturnValue({
          innerJoin: jest.fn().mockReturnValue({
            where: jest.fn().mockResolvedValue([{ count: "movie-id-1" }]),
          }),
        }),
      })

      // Mock items query with search
      const mockItemsSelect = jest.fn().mockReturnValue({
        from: jest.fn().mockReturnValue({
          innerJoin: jest.fn().mockReturnValue({
            where: jest.fn().mockReturnValue({
              orderBy: jest.fn().mockReturnValue({
                limit: jest.fn().mockReturnValue({
                  offset: jest.fn().mockResolvedValue([]),
                }),
              }),
            }),
          }),
        }),
      })

      mockDb.select
        .mockReturnValueOnce(mockListSelect() as never)
        .mockReturnValueOnce(mockCountSelect() as never)
        .mockReturnValueOnce(mockItemsSelect() as never)

      const request = createMockRequest(
        "http://localhost:3000/api/lists/test-list/items?search=action",
      )
      const response = await GET(request, {
        params: Promise.resolve({ identifier: "test-list" }),
      })

      expect(response.status).toBe(200)
    })
  })

  describe("POST", () => {
    it("should return 401 if user is not authenticated", async () => {
      mockGetSession.mockResolvedValue(null)

      const request = createMockRequest(
        "http://localhost:3000/api/lists/test-list/items",
        {
          method: "POST",
          body: { movieId: 12345 },
        },
      )
      const response = await POST(request, {
        params: Promise.resolve({ identifier: "test-list" }),
      })

      expect(response.status).toBe(401)
      const body = await response.json()
      expect(body).toEqual({ error: "Unauthorized" })
    })

    it("should return 400 if movieId is missing", async () => {
      mockGetSession.mockResolvedValue(mockSession)

      const request = createMockRequest(
        "http://localhost:3000/api/lists/test-list/items",
        {
          method: "POST",
          body: {},
        },
      )
      const response = await POST(request, {
        params: Promise.resolve({ identifier: "test-list" }),
      })

      expect(response.status).toBe(400)
      const body = await response.json()
      expect(body).toEqual({ error: "Movie ID is required" })
    })

    it("should return 404 if list is not found", async () => {
      mockGetSession.mockResolvedValue(mockSession)

      const mockSelect = jest.fn().mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([]),
          }),
        }),
      })

      mockDb.select.mockReturnValue(mockSelect() as never)

      const request = createMockRequest(
        "http://localhost:3000/api/lists/nonexistent/items",
        {
          method: "POST",
          body: { movieId: 12345 },
        },
      )
      const response = await POST(request, {
        params: Promise.resolve({ identifier: "nonexistent" }),
      })

      expect(response.status).toBe(404)
      const body = await response.json()
      expect(body).toEqual({ error: "List not found" })
    })

    it("should add existing movie to list", async () => {
      mockGetSession.mockResolvedValue(mockSession)

      // Mock list lookup
      const mockListSelect = jest.fn().mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([mockList]),
          }),
        }),
      })

      // Mock movie lookup (existing movie)
      const mockMovieSelect = jest.fn().mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([mockMovie]),
          }),
        }),
      })

      // Mock insert
      const mockInsert = jest.fn().mockReturnValue({
        values: jest.fn().mockReturnValue({
          onConflictDoNothing: jest.fn().mockResolvedValue(undefined),
        }),
      })

      mockDb.select
        .mockReturnValueOnce(mockListSelect() as never)
        .mockReturnValueOnce(mockMovieSelect() as never)
      mockDb.insert.mockReturnValue(mockInsert() as never)

      const request = createMockRequest(
        "http://localhost:3000/api/lists/test-list/items",
        {
          method: "POST",
          body: { movieId: 12345 },
        },
      )
      const response = await POST(request, {
        params: Promise.resolve({ identifier: "test-list" }),
      })

      expect(response.status).toBe(200)
      const body = await response.json()
      expect(body).toEqual({ success: true, message: "Item added to list" })
    })

    it("should create new movie and add to list", async () => {
      mockGetSession.mockResolvedValue(mockSession)

      // Mock list lookup
      const mockListSelect = jest.fn().mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([mockList]),
          }),
        }),
      })

      // Mock movie lookup (no existing movie)
      const mockMovieSelect = jest.fn().mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([]),
          }),
        }),
      })

      // Mock movie insert
      const mockMovieInsert = jest.fn().mockReturnValue({
        values: jest.fn().mockReturnValue({
          returning: jest.fn().mockResolvedValue([mockMovie]),
        }),
      })

      // Mock list item insert
      const mockListItemInsert = jest.fn().mockReturnValue({
        values: jest.fn().mockReturnValue({
          onConflictDoNothing: jest.fn().mockResolvedValue(undefined),
        }),
      })

      mockDb.select
        .mockReturnValueOnce(mockListSelect() as never)
        .mockReturnValueOnce(mockMovieSelect() as never)
      mockDb.insert
        .mockReturnValueOnce(mockMovieInsert() as never)
        .mockReturnValueOnce(mockListItemInsert() as never)
      mockTmdbService.getMovieDetails.mockResolvedValue(mockTmdbMovie as never)

      const request = createMockRequest(
        "http://localhost:3000/api/lists/test-list/items",
        {
          method: "POST",
          body: { movieId: 12345 },
        },
      )
      const response = await POST(request, {
        params: Promise.resolve({ identifier: "test-list" }),
      })

      expect(response.status).toBe(200)
      const body = await response.json()
      expect(body).toEqual({ success: true, message: "Item added to list" })
      expect(mockTmdbService.getMovieDetails).toHaveBeenCalledWith(12345)
    })

    it("should return 404 if movie not found in TMDB", async () => {
      mockGetSession.mockResolvedValue(mockSession)

      // Mock list lookup
      const mockListSelect = jest.fn().mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([mockList]),
          }),
        }),
      })

      // Mock movie lookup (no existing movie)
      const mockMovieSelect = jest.fn().mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([]),
          }),
        }),
      })

      mockDb.select
        .mockReturnValueOnce(mockListSelect() as never)
        .mockReturnValueOnce(mockMovieSelect() as never)
      mockTmdbService.getMovieDetails.mockResolvedValue(null as never)

      const request = createMockRequest(
        "http://localhost:3000/api/lists/test-list/items",
        {
          method: "POST",
          body: { movieId: 12345 },
        },
      )
      const response = await POST(request, {
        params: Promise.resolve({ identifier: "test-list" }),
      })

      expect(response.status).toBe(404)
      const body = await response.json()
      expect(body).toEqual({ error: "Movie not found in TMDB" })
    })

    it("should handle errors gracefully", async () => {
      mockGetSession.mockRejectedValue(new Error("Database error"))

      const request = createMockRequest(
        "http://localhost:3000/api/lists/test-list/items",
        {
          method: "POST",
          body: { movieId: 12345 },
        },
      )
      const response = await POST(request, {
        params: Promise.resolve({ identifier: "test-list" }),
      })

      expect(response.status).toBe(500)
      const body = await response.json()
      expect(body).toEqual({ error: "Internal Server Error" })
    })
  })
})
