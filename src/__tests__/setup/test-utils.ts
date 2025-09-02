import { NextRequest } from "next/server"

// Test utilities for API route testing
export const createMockRequest = (
  url: string,
  options: {
    method?: string
    headers?: Record<string, string>
    body?: unknown
  } = {},
): NextRequest => {
  const { method = "GET", headers = {}, body } = options

  const request = new NextRequest(url, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
  })

  return request
}

// Mock session data
export const mockSession = {
  session: {
    id: "test-session-id",
    userId: "test-user-id",
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours from now
    createdAt: new Date(),
    updatedAt: new Date(),
    token: "test-token",
    ipAddress: "127.0.0.1",
    userAgent: "test-agent",
  },
  user: {
    id: "test-user-id",
    email: "test@example.com",
    name: "Test User",
  },
}

// Mock TMDB API responses
export const mockTmdbMovie = {
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
}

export const mockTmdbApiResponse = {
  page: 1,
  results: [mockTmdbMovie],
  total_pages: 1,
  total_results: 1,
}

// Mock database responses
export const mockList = {
  id: "test-list-id",
  name: "Test List",
  slug: "test-list",
  userId: "test-user-id",
  createdAt: new Date(),
  updatedAt: new Date(),
}

export const mockMovie = {
  id: "test-movie-id",
  tmdbId: 12345,
  title: "Test Movie",
  year: 2023,
  metadata: {
    poster_path: "/test-poster.jpg",
    backdrop_path: "/test-backdrop.jpg",
    vote_average: 8.5,
    release_date: "2023-01-01",
  },
  createdAt: new Date(),
  updatedAt: new Date(),
}

export const mockListItem = {
  id: "test-list-item-id",
  listId: "test-list-id",
  movieId: "test-movie-id",
  createdAt: new Date(),
}
