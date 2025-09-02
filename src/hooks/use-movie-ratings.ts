"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

import { routes } from "@/lib/constants"
import type { Rating, RatingResponse } from "@/lib/types"

async function fetchRating(
  movieId: string,
  signal?: AbortSignal,
): Promise<RatingResponse> {
  const res = await fetch(routes.api.movies.ratings(movieId), {
    signal,
    credentials: "same-origin",
  })
  if (!res.ok) {
    const error = await res.text()
    throw new Error(error || "Failed to fetch rating")
  }
  return res.json()
}

async function setRating(movieId: string, score: number): Promise<Rating> {
  const res = await fetch(routes.api.movies.ratings(movieId), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "same-origin",
    body: JSON.stringify({ score }),
  })

  if (!res.ok) {
    const error = await res.text()
    throw new Error(error || "Failed to set rating")
  }

  const data = await res.json()
  return data.rating
}

async function removeRating(movieId: string): Promise<void> {
  const res = await fetch(routes.api.movies.ratings(movieId), {
    method: "DELETE",
    credentials: "same-origin",
  })

  if (!res.ok) {
    const error = await res.text()
    throw new Error(error || "Failed to remove rating")
  }
}

export function useMovieRating(movieId: string) {
  const qc = useQueryClient()
  const queryKey = ["movie-rating", movieId]

  const query = useQuery({
    queryKey,
    queryFn: ({ signal }) => fetchRating(movieId, signal),
    enabled: false, // Don't fetch automatically - use batch status instead
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  })

  const setRatingMutation = useMutation({
    mutationFn: (score: number) => setRating(movieId, score),
    onMutate: async (score) => {
      await qc.cancelQueries({ queryKey })
      const previousData = qc.getQueryData<RatingResponse>(queryKey)

      qc.setQueryData<RatingResponse>(queryKey, { rating: score })

      return { previousData }
    },
    onError: (error, _score, context) => {
      if (context?.previousData) {
        qc.setQueryData(queryKey, context.previousData)
      }
      toast.error(error.message || "Failed to set rating")
    },
    onSuccess: (_, score) => {
      toast.success(`Rated ${score}/10`)
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey })
    },
  })

  const removeRatingMutation = useMutation({
    mutationFn: () => removeRating(movieId),
    onMutate: async () => {
      await qc.cancelQueries({ queryKey })
      const previousData = qc.getQueryData<RatingResponse>(queryKey)

      qc.setQueryData<RatingResponse>(queryKey, { rating: null })

      return { previousData }
    },
    onError: (error, _variables, context) => {
      if (context?.previousData) {
        qc.setQueryData(queryKey, context.previousData)
      }
      toast.error(error.message || "Failed to remove rating")
    },
    onSuccess: () => {
      toast.success("Rating removed")
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey })
    },
  })

  return {
    ...query,
    rating: query.data?.rating ?? null,
    setRating: (score: number) => setRatingMutation.mutate(score),
    setRatingAsync: (score: number) => setRatingMutation.mutateAsync(score),
    removeRating: () => removeRatingMutation.mutate(),
    removeRatingAsync: () => removeRatingMutation.mutateAsync(),
    isSettingRating: setRatingMutation.isPending,
    isRemovingRating: removeRatingMutation.isPending,
    error:
      setRatingMutation.error || (removeRatingMutation.error as Error | null),
  }
}
