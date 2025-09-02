import { Credits, CrewMember } from "@/lib/types"
import {
  buildQueryString,
  formatRuntime,
  getDirector,
  isUUID,
  slugify,
} from "@/lib/utils/api"

describe("API Utils", () => {
  describe("buildQueryString", () => {
    it("should build query string from params", () => {
      const params = { page: 1, limit: 20, search: "test" }
      const result = buildQueryString(params)
      expect(result).toBe("&page=1&limit=20&search=test")
    })

    it("should handle empty params", () => {
      const result = buildQueryString({})
      expect(result).toBe("")
    })

    it("should handle undefined params", () => {
      const result = buildQueryString(undefined)
      expect(result).toBe("")
    })

    it("should filter out undefined and null values", () => {
      const params = { page: 1, limit: undefined, search: null, sort: "title" }
      const result = buildQueryString(params)
      expect(result).toBe("&page=1&sort=title")
    })

    it("should handle special characters in values", () => {
      const params = { search: "test movie & more" }
      const result = buildQueryString(params)
      expect(result).toBe("&search=test+movie+%26+more")
    })
  })

  describe("formatRuntime", () => {
    it("should format minutes to hours and minutes", () => {
      expect(formatRuntime(90)).toBe("1h 30m")
      expect(formatRuntime(120)).toBe("2h 0m")
      expect(formatRuntime(45)).toBe("0h 45m")
      expect(formatRuntime(0)).toBe("0h 0m")
    })

    it("should handle large runtimes", () => {
      expect(formatRuntime(180)).toBe("3h 0m")
      expect(formatRuntime(195)).toBe("3h 15m")
    })
  })

  describe("getDirector", () => {
    it("should return director from credits", () => {
      const credits: Credits = {
        crew: [
          { id: 1, name: "John Director", job: "Director" } as CrewMember,
          { id: 2, name: "Jane Producer", job: "Producer" } as CrewMember,
        ],
        cast: [],
      }

      const result = getDirector(credits)
      expect(result).toEqual({ id: 1, name: "John Director", job: "Director" })
    })

    it("should return default object when no director found", () => {
      const credits: Credits = {
        crew: [{ id: 1, name: "Jane Producer", job: "Producer" } as CrewMember],
        cast: [],
      }

      const result = getDirector(credits)
      expect(result).toEqual({ name: "N/A" })
    })

    it("should return default object when credits is undefined", () => {
      const result = getDirector(undefined as never)
      expect(result).toEqual({ name: "N/A" })
    })
  })

  describe("slugify", () => {
    it("should convert text to slug format", () => {
      expect(slugify("Hello World")).toBe("hello-world")
      expect(slugify("Test Movie Title")).toBe("test-movie-title")
      expect(slugify("Action & Adventure")).toBe("action--adventure")
    })

    it("should handle special characters", () => {
      expect(slugify("Movie: The Sequel!")).toBe("movie-the-sequel")
      expect(slugify("Test@#$%^&*()")).toBe("test")
    })

    it("should handle empty string", () => {
      expect(slugify("")).toBe("")
    })

    it("should handle already slugified text", () => {
      expect(slugify("already-slugified")).toBe("already-slugified")
    })
  })

  describe("isUUID", () => {
    it("should return true for valid UUIDs", () => {
      expect(isUUID("123e4567-e89b-12d3-a456-426614174000")).toBe(true)
      expect(isUUID("550e8400-e29b-41d4-a716-446655440000")).toBe(true)
      expect(isUUID("6ba7b810-9dad-11d1-80b4-00c04fd430c8")).toBe(true)
    })

    it("should return false for invalid UUIDs", () => {
      expect(isUUID("not-a-uuid")).toBe(false)
      expect(isUUID("123")).toBe(false)
      expect(isUUID("123e4567-e89b-12d3-a456")).toBe(false)
      expect(isUUID("")).toBe(false)
    })

    it("should handle uppercase UUIDs", () => {
      expect(isUUID("123E4567-E89B-12D3-A456-426614174000")).toBe(true)
    })

    it("should handle mixed case UUIDs", () => {
      expect(isUUID("123e4567-E89B-12d3-A456-426614174000")).toBe(true)
    })
  })
})
