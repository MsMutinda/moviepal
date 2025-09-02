import { NextRequest } from "next/server"

import { GET } from "@/app/api/movies/search/route"
import { tmdbService } from "@/services/tmdb.service"

// Mock TMDB service
jest.mock("@/services/tmdb.service", () => ({
  tmdbService: {
    searchMovies: jest.fn(),
  },
}))

const mockTmdbService = tmdbService as jest.Mocked<typeof tmdbService>

// Helper function to create mock requests
const createMockRequest = (url: string) => {
  return new NextRequest(url)
}

describe("/api/movies/search", () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe("GET", () => {
    it("should return empty results when query is missing", async () => {
      const request = createMockRequest(
        "http://localhost:3000/api/movies/search",
      )
      const response = await GET(request)

      expect(response.status).toBe(200)
      const body = await response.json()
      expect(body).toEqual({
        page: 1,
        results: [],
        total_pages: 0,
        total_results: 0,
      })
    })

    it("should return empty results when query is empty string", async () => {
      const request = createMockRequest(
        "http://localhost:3000/api/movies/search?query=",
      )
      const response = await GET(request)

      expect(response.status).toBe(200)
      const body = await response.json()
      expect(body).toEqual({
        page: 1,
        results: [],
        total_pages: 0,
        total_results: 0,
      })
    })

    it("should return empty results when query is only whitespace", async () => {
      const request = createMockRequest(
        "http://localhost:3000/api/movies/search?query=%20%20%20",
      )
      const response = await GET(request)

      expect(response.status).toBe(200)
      const body = await response.json()
      expect(body).toEqual({
        page: 1,
        results: [],
        total_pages: 0,
        total_results: 0,
      })
    })

    it("should search movies with valid query", async () => {
      mockTmdbService.searchMovies.mockResolvedValue({
        page: 1,
        results: [
          {
            id: 12345,
            title: "Test Movie",
            overview: "A test movie for testing purposes",
            release_date: "2023-01-01",
            poster_path: "/test-poster.jpg",
            backdrop_path: "/test-backdrop.jpg",
            genre_ids: [28, 12],
            original_language: "en",
            popularity: 100,
            vote_average: 8.5,
            vote_count: 1000,
          },
        ],
        total_pages: 1,
        total_results: 1,
      })

      const request = createMockRequest(
        "http://localhost:3000/api/movies/search?query=action&page=1",
      )
      const response = await GET(request)

      expect(mockTmdbService.searchMovies).toHaveBeenCalledWith("action", 1)
      expect(response.status).toBe(200)
      const body = await response.json()
      expect(body).toEqual({
        page: 1,
        results: [
          {
            id: 12345,
            title: "Test Movie",
            overview: "A test movie for testing purposes",
            release_date: "2023-01-01",
            poster_path: "/test-poster.jpg",
            backdrop_path: "/test-backdrop.jpg",
            genre_ids: [28, 12],
            original_language: "en",
            popularity: 100,
            vote_average: 8.5,
            vote_count: 1000,
          },
        ],
        total_pages: 1,
        total_results: 1,
      })
    })

    it("should use default page when not provided", async () => {
      mockTmdbService.searchMovies.mockResolvedValue({
        page: 1,
        results: [
          {
            id: 12345,
            title: "Test Movie",
            overview: "A test movie for testing purposes",
            release_date: "2023-01-01",
            poster_path: "/test-poster.jpg",
            backdrop_path: "/test-backdrop.jpg",
            genre_ids: [28, 12],
            original_language: "en",
            popularity: 100,
            vote_average: 8.5,
            vote_count: 1000,
          },
        ],
        total_pages: 1,
        total_results: 1,
      })

      const request = createMockRequest(
        "http://localhost:3000/api/movies/search?query=action",
      )
      const response = await GET(request)

      expect(mockTmdbService.searchMovies).toHaveBeenCalledWith("action", 1)
      expect(response.status).toBe(200)
    })

    it("should handle custom page parameter", async () => {
      mockTmdbService.searchMovies.mockResolvedValue({
        page: 1,
        results: [
          {
            id: 12345,
            title: "Test Movie",
            overview: "A test movie for testing purposes",
            release_date: "2023-01-01",
            poster_path: "/test-poster.jpg",
            backdrop_path: "/test-backdrop.jpg",
            genre_ids: [28, 12],
            original_language: "en",
            popularity: 100,
            vote_average: 8.5,
            vote_count: 1000,
          },
        ],
        total_pages: 1,
        total_results: 1,
      })

      const request = createMockRequest(
        "http://localhost:3000/api/movies/search?query=action&page=3",
      )
      const response = await GET(request)

      expect(mockTmdbService.searchMovies).toHaveBeenCalledWith("action", 3)
      expect(response.status).toBe(200)
    })

    it("should trim whitespace from query", async () => {
      mockTmdbService.searchMovies.mockResolvedValue({
        page: 1,
        results: [
          {
            id: 12345,
            title: "Test Movie",
            overview: "A test movie for testing purposes",
            release_date: "2023-01-01",
            poster_path: "/test-poster.jpg",
            backdrop_path: "/test-backdrop.jpg",
            genre_ids: [28, 12],
            original_language: "en",
            popularity: 100,
            vote_average: 8.5,
            vote_count: 1000,
          },
        ],
        total_pages: 1,
        total_results: 1,
      })

      const request = createMockRequest(
        "http://localhost:3000/api/movies/search?query=%20action%20",
      )
      const response = await GET(request)

      expect(mockTmdbService.searchMovies).toHaveBeenCalledWith("action", 1)
      expect(response.status).toBe(200)
    })

    it("should return empty results when TMDB service returns no data", async () => {
      mockTmdbService.searchMovies.mockResolvedValue(null as never)

      const request = createMockRequest(
        "http://localhost:3000/api/movies/search?query=action&page=2",
      )
      const response = await GET(request)

      expect(response.status).toBe(200)
      const body = await response.json()
      expect(body).toEqual({
        page: 2,
        results: [],
        total_pages: 0,
        total_results: 0,
      })
    })

    it("should return empty results when TMDB service returns data without results", async () => {
      mockTmdbService.searchMovies.mockResolvedValue({} as never)

      const request = createMockRequest(
        "http://localhost:3000/api/movies/search?query=action",
      )
      const response = await GET(request)

      expect(response.status).toBe(200)
      const body = await response.json()
      expect(body).toEqual({
        page: 1,
        results: [],
        total_pages: 0,
        total_results: 0,
      })
    })

    it("should handle TMDB service errors gracefully", async () => {
      mockTmdbService.searchMovies.mockRejectedValue(
        new Error("TMDB API error"),
      )

      const request = createMockRequest(
        "http://localhost:3000/api/movies/search?query=action",
      )
      const response = await GET(request)

      expect(response.status).toBe(200)
      const body = await response.json()
      expect(body).toEqual({
        page: 1,
        results: [],
        total_pages: 0,
        total_results: 0,
      })
    })

    it("should set proper cache headers", async () => {
      mockTmdbService.searchMovies.mockResolvedValue({
        page: 1,
        results: [
          {
            id: 12345,
            title: "Test Movie",
            overview: "A test movie for testing purposes",
            release_date: "2023-01-01",
            poster_path: "/test-poster.jpg",
            backdrop_path: "/test-backdrop.jpg",
            genre_ids: [28, 12],
            original_language: "en",
            popularity: 100,
            vote_average: 8.5,
            vote_count: 1000,
          },
        ],
        total_pages: 1,
        total_results: 1,
      })

      const request = createMockRequest(
        "http://localhost:3000/api/movies/search?query=action",
      )
      const response = await GET(request)

      expect(response.headers.get("Cache-Control")).toBe(
        "no-cache, no-store, must-revalidate",
      )
      expect(response.headers.get("Pragma")).toBe("no-cache")
      expect(response.headers.get("Expires")).toBe("0")
    })

    it("should handle special characters in query", async () => {
      mockTmdbService.searchMovies.mockResolvedValue({
        page: 1,
        results: [
          {
            id: 12345,
            title: "Test Movie",
            overview: "A test movie for testing purposes",
            release_date: "2023-01-01",
            poster_path: "/test-poster.jpg",
            backdrop_path: "/test-backdrop.jpg",
            genre_ids: [28, 12],
            original_language: "en",
            popularity: 100,
            vote_average: 8.5,
            vote_count: 1000,
          },
        ],
        total_pages: 1,
        total_results: 1,
      })

      const request = createMockRequest(
        "http://localhost:3000/api/movies/search?query=action%20%26%20adventure",
      )
      const response = await GET(request)

      expect(mockTmdbService.searchMovies).toHaveBeenCalledWith(
        "action & adventure",
        1,
      )
      expect(response.status).toBe(200)
    })
  })
})
