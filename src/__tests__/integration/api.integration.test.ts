import { http, HttpResponse } from "msw"

import { server } from "@/__tests__/mocks/server"
import { createMockRequest, mockSession } from "@/__tests__/setup/test-utils"
// Import the route handlers
import {
  GET as getListItems,
  POST as addListItem,
} from "@/app/api/lists/[identifier]/items/route"
import { GET as searchMovies } from "@/app/api/movies/search/route"

// Mock auth for integration tests
jest.mock("@/lib/auth", () => ({
  auth: {
    api: {
      getSession: jest.fn(),
    },
  },
}))

// Mock database for integration tests
jest.mock("@/lib/database/database", () => ({
  db: {
    select: jest.fn(),
    insert: jest.fn(),
  },
}))

// Mock TMDB service for integration tests
jest.mock("@/services/tmdb.service", () => ({
  tmdbService: {
    getMovieDetails: jest.fn(),
  },
}))

import { auth } from "@/lib/auth"
import { db } from "@/lib/database/database"
import { Movie } from "@/lib/types"
import { tmdbService } from "@/services/tmdb.service"

const mockAuth = auth as jest.Mocked<typeof auth>
const mockDb = db as jest.Mocked<typeof db>
const mockTmdbService = tmdbService as jest.Mocked<typeof tmdbService>

// Type assertion for Jest mock methods
const mockGetSession = mockAuth.api.getSession as jest.MockedFunction<
  typeof mockAuth.api.getSession
>
const mockSelect = mockDb.select as jest.MockedFunction<typeof mockDb.select>
const mockInsert = mockDb.insert as jest.MockedFunction<typeof mockDb.insert>
const mockGetMovieDetails =
  mockTmdbService.getMovieDetails as jest.MockedFunction<
    typeof mockTmdbService.getMovieDetails
  >

describe("API Integration Tests", () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockGetSession.mockResolvedValue(mockSession)
  })

  describe("Movie Search Integration", () => {
    it("should search movies and return results", async () => {
      const request = createMockRequest(
        "http://localhost:3000/api/movies/search?query=action",
      )
      const response = await searchMovies(request)

      expect(response.status).toBe(200)
      const body = await response.json()
      expect(body).toHaveProperty("results")
      expect(body.results).toBeInstanceOf(Array)
    })

    it("should handle search with no results", async () => {
      // Override the default handler for this test
      server.use(
        http.get("https://api.themoviedb.org/3/search/movie", () => {
          return HttpResponse.json({
            page: 1,
            results: [],
            total_pages: 0,
            total_results: 0,
          })
        }),
      )

      const request = createMockRequest(
        "http://localhost:3000/api/movies/search?query=nonexistent",
      )
      const response = await searchMovies(request)

      expect(response.status).toBe(200)
      const body = await response.json()
      expect(body.results).toEqual([])
    })
  })

  describe("List Items Integration", () => {
    it("should get list items with proper pagination", async () => {
      const mockList = {
        id: "test-list-id",
        name: "Test List",
        slug: "test-list",
        userId: "test-user-id",
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      const mockItems = [
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
      ]

      // Mock database responses
      const mockListSelect = jest.fn().mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([mockList]),
          }),
        }),
      })

      const mockCountSelect = jest.fn().mockReturnValue({
        from: jest.fn().mockReturnValue({
          innerJoin: jest.fn().mockReturnValue({
            where: jest.fn().mockResolvedValue([{ count: "movie-id-1" }]),
          }),
        }),
      })

      const mockItemsSelect = jest.fn().mockReturnValue({
        from: jest.fn().mockReturnValue({
          innerJoin: jest.fn().mockReturnValue({
            where: jest.fn().mockReturnValue({
              orderBy: jest.fn().mockReturnValue({
                limit: jest.fn().mockReturnValue({
                  offset: jest.fn().mockResolvedValue(mockItems),
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
      const response = await getListItems(request, {
        params: Promise.resolve({ identifier: "test-list" }),
      })

      expect(response.status).toBe(200)
      const body = await response.json()
      expect(body).toHaveProperty("items")
      expect(body).toHaveProperty("pagination")
      expect(body.items).toHaveLength(1)
      expect(body.pagination.page).toBe(1)
      expect(body.pagination.limit).toBe(20)
    })

    it("should add movie to list with TMDB integration", async () => {
      const mockList = {
        id: "test-list-id",
        name: "Test List",
        slug: "test-list",
        userId: "test-user-id",
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      const mockMovie = {
        id: "new-movie-id",
        tmdbId: 12345,
        title: "Test Movie",
        year: 2023,
        metadata: { poster_path: "/poster.jpg" },
        createdAt: new Date(),
        updatedAt: new Date(),
      }

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

      // Mock TMDB service
      mockGetMovieDetails.mockResolvedValue({
        id: 12345,
        title: "Test Movie",
        overview: "A test movie for testing purposes",
        release_date: "2023-01-01",
        poster_path: "/test-poster.jpg",
        backdrop_path: "/test-backdrop.jpg",
        vote_average: 8.5,
        vote_count: 1000,
        adult: false,
        genre_ids: [28, 12],
        original_language: "en",
        original_title: "Test Movie",
        popularity: 100,
        video: false,
      } as Movie)

      mockSelect
        .mockReturnValueOnce(mockListSelect() as never)
        .mockReturnValueOnce(mockMovieSelect() as never)
      mockInsert
        .mockReturnValueOnce(mockMovieInsert() as never)
        .mockReturnValueOnce(mockListItemInsert() as never)

      const request = createMockRequest(
        "http://localhost:3000/api/lists/test-list/items",
        {
          method: "POST",
          body: { movieId: 12345 },
        },
      )
      const response = await addListItem(request, {
        params: Promise.resolve({ identifier: "test-list" }),
      })

      expect(response.status).toBe(200)
      const body = await response.json()
      expect(body).toEqual({ success: true, message: "Item added to list" })
    })
  })

  describe("Error Handling Integration", () => {
    it("should handle authentication errors consistently", async () => {
      mockGetSession.mockResolvedValue(null)

      const request = createMockRequest(
        "http://localhost:3000/api/lists/test-list/items",
      )
      const response = await getListItems(request, {
        params: Promise.resolve({ identifier: "test-list" }),
      })

      expect(response.status).toBe(401)
      const body = await response.json()
      expect(body).toEqual({ error: "Unauthorized" })
    })

    it("should handle TMDB API errors gracefully", async () => {
      // Override handler to return error
      server.use(
        http.get("https://api.themoviedb.org/3/search/movie", () => {
          return HttpResponse.json(
            { error: "API key invalid" },
            { status: 401 },
          )
        }),
      )

      const request = createMockRequest(
        "http://localhost:3000/api/movies/search?query=test",
      )
      const response = await searchMovies(request)

      // Should still return 200 with empty results due to error handling
      expect(response.status).toBe(200)
      const body = await response.json()
      expect(body.results).toEqual([])
    })
  })
})
