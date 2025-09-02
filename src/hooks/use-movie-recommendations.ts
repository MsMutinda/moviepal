"use client"

import { useQuery } from "@tanstack/react-query"

import { routes } from "@/lib/constants"
import type { ApiResponse, Movie } from "@/lib/types"

interface RecommendationMovie extends Movie {
  recommendationScore?: number
  recommendationReason?: string
}

interface RecommendationsResponse extends Omit<ApiResponse, "results"> {
  results: RecommendationMovie[]
  reason: string
  generatedAt: string
  userActivity: {
    likedMovies: number
    ratedMovies: number
    totalLists: number
  }
  recommendationStats?: {
    totalStrategies: number
    genreBased: number
    ratingBased: number
    popularityBased: number
    recencyBased: number
  }
}

async function fetchRecommendations(
  page = 1,
  limit = 20,
  forceRefresh = false,
  signal?: AbortSignal,
): Promise<RecommendationsResponse> {
  const searchParams = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
  })

  if (forceRefresh) {
    searchParams.set("refresh", "true")
  }

  const res = await fetch(
    `${routes.api.movies.recommendations}?${searchParams}`,
    {
      signal,
      credentials: "same-origin",
    },
  )

  if (!res.ok) {
    const error = await res.text()
    throw new Error(error || "Failed to fetch recommendations")
  }

  return res.json()
}

export function useMovieRecommendations(
  page = 1,
  limit = 20,
  forceRefresh = false,
) {
  return useQuery({
    queryKey: ["movie-recommendations", page, limit, forceRefresh],
    queryFn: ({ signal }) =>
      fetchRecommendations(page, limit, forceRefresh, signal),
    staleTime: 0, // Always consider data stale to ensure fresh fetches
    gcTime: 5 * 60 * 1000, // Keep in cache for 5 minutes only
    retry: 2,
    refetchOnWindowFocus: true, // Refetch when user returns to tab
    refetchInterval: false, // Disable auto-refresh to prevent conflicts
  })
}
