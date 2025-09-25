"use client"

import { useQuery, useQueryClient } from "@tanstack/react-query"
import { useCallback } from "react"

import { routes } from "@/lib/constants"

type MovieStatus = {
  liked: boolean
  rating: number | null
}

type BatchStatusResponse = {
  movies: Record<string, MovieStatus>
}

async function fetchBatchStatus(
  movieIds: string[],
): Promise<BatchStatusResponse> {
  const res = await fetch(routes.api.movies.batchStatus, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "same-origin",
    body: JSON.stringify({ movieIds }),
  })

  if (!res.ok) {
    const error = await res.text()
    throw new Error(error || "Failed to fetch batch status")
  }

  return res.json()
}

import { useAuthGuard } from "@/hooks/use-auth-guard"

export function useMovieBatchStatus(movieIds: string[]) {
  const qc = useQueryClient()
  const { isAuthenticated } = useAuthGuard()
  const queryKey = ["movie-batch-status", movieIds.sort().join(",")]

  const query = useQuery({
    queryKey,
    queryFn: () => fetchBatchStatus(movieIds),
    enabled: isAuthenticated && movieIds.length > 0,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false, // Don't refetch on window focus
    refetchOnMount: false, // Don't refetch on mount if data exists
  })

  const getMovieStatus = useCallback(
    (movieId: string): MovieStatus => {
      return query.data?.movies[movieId] || { liked: false, rating: null }
    },
    [query.data],
  )

  const updateMovieStatus = useCallback(
    (movieId: string, updates: Partial<MovieStatus>) => {
      qc.setQueryData<BatchStatusResponse>(queryKey, (old) => {
        if (!old) return old
        return {
          ...old,
          movies: {
            ...old.movies,
            [movieId]: {
              ...old.movies[movieId],
              ...updates,
            },
          },
        }
      })
    },
    [qc, queryKey],
  )

  return {
    ...query,
    getMovieStatus,
    updateMovieStatus,
    invalidate: () => qc.invalidateQueries({ queryKey }),
  }
}
