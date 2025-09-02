import {
  mockTmdbApiResponse,
  mockTmdbMovie,
} from "@/__tests__/setup/test-utils"
import { tmdbService } from "@/services/tmdb.service"

// Mock fetch globally
global.fetch = jest.fn()

const mockFetch = fetch as jest.MockedFunction<typeof fetch>

describe("TMDB Service", () => {
  beforeEach(() => {
    jest.clearAllMocks()
    // Set up environment variables
    process.env.TMDB_API_KEY = "test-api-key"
    process.env.TMDB_BASE_URL = "https://api.themoviedb.org/3"
  })

  afterEach(() => {
    delete process.env.TMDB_API_KEY
  })

  describe("request method", () => {
    it("should make successful API request", async () => {
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue(mockTmdbMovie),
      }
      mockFetch.mockResolvedValue(mockResponse as never)

      const result = await tmdbService.request("/movie/12345")

      expect(mockFetch).toHaveBeenCalledWith(
        "https://api.themoviedb.org/3/movie/12345?api_key=test-api-key&language=en-US",
        { signal: undefined },
      )
      expect(result).toEqual(mockTmdbMovie)
    })

    it("should throw error when API key is not defined", async () => {
      // Temporarily remove the API key
      const originalApiKey = process.env.TMDB_API_KEY
      delete process.env.TMDB_API_KEY

      // Mock the constants module to return undefined API key
      jest.doMock("@/lib/constants", () => ({
        tmdbApiKey: undefined,
        tmdbBaseUrl: "https://api.themoviedb.org/3",
      }))

      // Clear the module cache and re-import
      jest.resetModules()
      const { tmdbService: serviceWithoutKey } = await import(
        "@/services/tmdb.service"
      )

      await expect(serviceWithoutKey.request("/movie/12345")).rejects.toThrow(
        "TMDB API key is not defined.",
      )

      // Restore the API key
      if (originalApiKey) {
        process.env.TMDB_API_KEY = originalApiKey
      }
    })

    it("should handle 401 authentication error", async () => {
      const mockResponse = {
        ok: false,
        status: 401,
        text: jest.fn().mockResolvedValue("Unauthorized"),
      }
      mockFetch.mockResolvedValue(mockResponse as never)

      await expect(tmdbService.request("/movie/12345")).rejects.toThrow(
        "TMDB Authentication failed. Please check your API key.",
      )
    })

    it("should handle 404 not found error", async () => {
      const mockResponse = {
        ok: false,
        status: 404,
        text: jest.fn().mockResolvedValue("Not Found"),
      }
      mockFetch.mockResolvedValue(mockResponse as never)

      await expect(tmdbService.request("/movie/12345")).rejects.toThrow(
        "TMDB endpoint not found: /movie/12345.",
      )
    })

    it("should handle 429 rate limit error", async () => {
      const mockResponse = {
        ok: false,
        status: 429,
        text: jest.fn().mockResolvedValue("Rate Limited"),
      }
      mockFetch.mockResolvedValue(mockResponse as never)

      await expect(tmdbService.request("/movie/12345")).rejects.toThrow(
        "TMDB rate limit exceeded. Please try again later.",
      )
    })

    it("should retry on 5xx errors", async () => {
      const mockResponse500 = {
        ok: false,
        status: 500,
        text: jest.fn().mockResolvedValue("Internal Server Error"),
      }
      const mockResponse200 = {
        ok: true,
        json: jest.fn().mockResolvedValue(mockTmdbMovie),
      }

      mockFetch
        .mockResolvedValueOnce(mockResponse500 as never)
        .mockResolvedValueOnce(mockResponse200 as never)

      const result = await tmdbService.request("/movie/12345", { retries: 1 })

      expect(mockFetch).toHaveBeenCalledTimes(2)
      expect(result).toEqual(mockTmdbMovie)
    })

    it("should include query parameters in URL", async () => {
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue(mockTmdbApiResponse),
      }
      mockFetch.mockResolvedValue(mockResponse as never)

      await tmdbService.request("/search/movie", {
        query: { query: "test", page: 1 },
      })

      expect(mockFetch).toHaveBeenCalledWith(
        "https://api.themoviedb.org/3/search/movie?api_key=test-api-key&language=en-US&query=test&page=1",
        { signal: undefined },
      )
    })
  })

  describe("getMovieDetails", () => {
    it("should get movie details", async () => {
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue(mockTmdbMovie),
      }
      mockFetch.mockResolvedValue(mockResponse as never)

      const result = await tmdbService.getMovieDetails(12345)

      expect(mockFetch).toHaveBeenCalledWith(
        "https://api.themoviedb.org/3/movie/12345?api_key=test-api-key&language=en-US",
        { signal: undefined },
      )
      expect(result).toEqual(mockTmdbMovie)
    })

    it("should get movie keywords when requested", async () => {
      const mockKeywords = [{ id: 1, name: "action" }]
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue(mockKeywords),
      }
      mockFetch.mockResolvedValue(mockResponse as never)

      const result = await tmdbService.getMovieDetails(12345, true)

      expect(mockFetch).toHaveBeenCalledWith(
        "https://api.themoviedb.org/3/movie/12345/keywords?api_key=test-api-key&language=en-US",
        { signal: undefined },
      )
      expect(result).toEqual(mockKeywords)
    })

    it("should get movie trailer when requested", async () => {
      const mockTrailer = { results: [{ key: "abc123", type: "Trailer" }] }
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue(mockTrailer),
      }
      mockFetch.mockResolvedValue(mockResponse as never)

      const result = await tmdbService.getMovieDetails(12345, false, true)

      expect(mockFetch).toHaveBeenCalledWith(
        "https://api.themoviedb.org/3/movie/12345/videos?api_key=test-api-key&language=en-US",
        { signal: undefined },
      )
      expect(result).toEqual(mockTrailer)
    })

    it("should get movie credits when requested", async () => {
      const mockCredits = { cast: [], crew: [] }
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue(mockCredits),
      }
      mockFetch.mockResolvedValue(mockResponse as never)

      const result = await tmdbService.getMovieDetails(
        12345,
        false,
        false,
        true,
      )

      expect(mockFetch).toHaveBeenCalledWith(
        "https://api.themoviedb.org/3/movie/12345/credits?api_key=test-api-key&language=en-US",
        { signal: undefined },
      )
      expect(result).toEqual(mockCredits)
    })
  })

  describe("searchMovies", () => {
    it("should search movies with query", async () => {
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue(mockTmdbApiResponse),
      }
      mockFetch.mockResolvedValue(mockResponse as never)

      const result = await tmdbService.searchMovies("test movie", 1)

      expect(mockFetch).toHaveBeenCalledWith(
        "https://api.themoviedb.org/3/search/movie?api_key=test-api-key&language=en-US&query=test+movie&include_adult=false&page=1",
        { signal: undefined },
      )
      expect(result).toEqual(mockTmdbApiResponse)
    })
  })

  describe("getPopularMovies", () => {
    it("should get popular movies", async () => {
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue(mockTmdbApiResponse),
      }
      mockFetch.mockResolvedValue(mockResponse as never)

      const result = await tmdbService.getPopularMovies()

      expect(mockFetch).toHaveBeenCalledWith(
        "https://api.themoviedb.org/3/movie/popular?api_key=test-api-key&language=en-US&include_adult=false",
        { signal: undefined },
      )
      expect(result).toEqual(mockTmdbApiResponse)
    })
  })

  describe("getTrendingMovies", () => {
    it("should get trending movies", async () => {
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue(mockTmdbApiResponse),
      }
      mockFetch.mockResolvedValue(mockResponse as never)

      const result = await tmdbService.getTrendingMovies()

      expect(mockFetch).toHaveBeenCalledWith(
        "https://api.themoviedb.org/3/trending/movie/day?api_key=test-api-key&language=en-US&include_adult=false",
        { signal: undefined },
      )
      expect(result).toEqual(mockTmdbApiResponse)
    })
  })

  describe("getGenres", () => {
    it("should get movie genres", async () => {
      const mockGenres = { genres: [{ id: 28, name: "Action" }] }
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue(mockGenres),
      }
      mockFetch.mockResolvedValue(mockResponse as never)

      const result = await tmdbService.getGenres()

      expect(mockFetch).toHaveBeenCalledWith(
        "https://api.themoviedb.org/3/genre/movie/list?api_key=test-api-key&language=en-US",
        { signal: undefined },
      )
      expect(result).toEqual(mockGenres)
    })
  })

  describe("getLanguages", () => {
    it("should get languages with pagination", async () => {
      const mockLanguages = [
        { iso_639_1: "en", english_name: "English", name: "English" },
        { iso_639_1: "es", english_name: "Spanish", name: "Español" },
        { iso_639_1: "fr", english_name: "French", name: "Français" },
      ]
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue(mockLanguages),
      }
      mockFetch.mockResolvedValue(mockResponse as never)

      const result = await tmdbService.getLanguages(1, 2)

      expect(mockFetch).toHaveBeenCalledWith(
        "https://api.themoviedb.org/3/configuration/languages?api_key=test-api-key&language=en-US",
        { signal: undefined },
      )
      expect(result).toEqual({
        results: mockLanguages.slice(0, 2),
        page: 1,
        total_pages: 2,
        total_results: 3,
      })
    })
  })

  describe("getRegions", () => {
    it("should get regions with pagination", async () => {
      const mockRegions = [
        {
          iso_3166_1: "US",
          english_name: "United States",
          native_name: "United States",
        },
        {
          iso_3166_1: "GB",
          english_name: "United Kingdom",
          native_name: "United Kingdom",
        },
        { iso_3166_1: "CA", english_name: "Canada", native_name: "Canada" },
      ]
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue(mockRegions),
      }
      mockFetch.mockResolvedValue(mockResponse as never)

      const result = await tmdbService.getRegions(1, 2)

      expect(mockFetch).toHaveBeenCalledWith(
        "https://api.themoviedb.org/3/configuration/countries?api_key=test-api-key&language=en-US",
        { signal: undefined },
      )
      expect(result).toEqual({
        results: mockRegions.slice(0, 2),
        page: 1,
        total_pages: 2,
        total_results: 3,
      })
    })
  })
})
