import { mockTmdbMovie } from "@/__tests__/setup/test-utils"
import { db } from "@/lib/database/database"
import { getOrCreateMovie } from "@/lib/utils/server"
import { tmdbService } from "@/services/tmdb.service"

// Mock the database and TMDB service
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

const mockDb = db as jest.Mocked<typeof db>
const mockTmdbService = tmdbService as jest.Mocked<typeof tmdbService>

describe("Server Utils", () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe("getOrCreateMovie", () => {
    it("should return existing movie if found in database", async () => {
      const existingMovie = {
        id: "movie-id",
        tmdbId: 12345,
        title: "Existing Movie",
        year: 2023,
        metadata: { poster_path: "/poster.jpg" },
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      const mockSelect = jest.fn().mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([existingMovie]),
          }),
        }),
      })

      mockDb.select.mockReturnValue(mockSelect() as never)

      const result = await getOrCreateMovie(12345)

      expect(result).toEqual(existingMovie)
      expect(mockTmdbService.getMovieDetails).not.toHaveBeenCalled()
    })

    it("should create new movie if not found in database", async () => {
      const newMovie = {
        id: "new-movie-id",
        tmdbId: 12345,
        title: "New Movie",
        year: 2023,
        metadata: { poster_path: "/poster.jpg" },
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      // Mock empty result for initial select
      const mockSelectEmpty = jest.fn().mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([]),
          }),
        }),
      })

      // Mock insert operation
      const mockInsert = jest.fn().mockReturnValue({
        values: jest.fn().mockReturnValue({
          onConflictDoNothing: jest.fn().mockReturnValue({
            returning: jest.fn().mockResolvedValue([newMovie]),
          }),
        }),
      })

      mockDb.select.mockReturnValue(mockSelectEmpty() as never)
      mockDb.insert.mockReturnValue(mockInsert() as never)
      mockTmdbService.getMovieDetails.mockResolvedValue(mockTmdbMovie as never)

      const result = await getOrCreateMovie(12345)

      expect(result).toEqual(newMovie)
      expect(mockTmdbService.getMovieDetails).toHaveBeenCalledWith(12345)
    })

    it("should throw error if movie not found in TMDB", async () => {
      const mockSelectEmpty = jest.fn().mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([]),
          }),
        }),
      })

      mockDb.select.mockReturnValue(mockSelectEmpty() as never)
      mockTmdbService.getMovieDetails.mockResolvedValue(null as never)

      await expect(getOrCreateMovie(12345)).rejects.toThrow(
        "Movie not found in TMDB",
      )
    })

    it("should handle conflict during insert and return existing movie", async () => {
      const existingMovie = {
        id: "existing-movie-id",
        tmdbId: 12345,
        title: "Existing Movie",
        year: 2023,
        metadata: { poster_path: "/poster.jpg" },
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      // Mock empty result for initial select
      const mockSelectEmpty = jest.fn().mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([]),
          }),
        }),
      })

      // Mock insert with conflict (returns null)
      const mockInsert = jest.fn().mockReturnValue({
        values: jest.fn().mockReturnValue({
          onConflictDoNothing: jest.fn().mockReturnValue({
            returning: jest.fn().mockResolvedValue([]), // Empty array means conflict
          }),
        }),
      })

      // Mock second select to return existing movie
      const mockSelectExisting = jest.fn().mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([existingMovie]),
          }),
        }),
      })

      mockDb.select
        .mockReturnValueOnce(mockSelectEmpty() as never)
        .mockReturnValueOnce(mockSelectExisting() as never)
      mockDb.insert.mockReturnValue(mockInsert() as never)
      mockTmdbService.getMovieDetails.mockResolvedValue(mockTmdbMovie as never)

      const result = await getOrCreateMovie(12345)

      expect(result).toEqual(existingMovie)
      expect(mockDb.select).toHaveBeenCalledTimes(2)
    })
  })
})
