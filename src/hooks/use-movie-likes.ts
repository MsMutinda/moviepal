"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

import { routes } from "@/lib/constants"
import type { LikeResponse } from "@/lib/types"

async function fetchLikeStatus(
  movieId: string,
  signal?: AbortSignal,
): Promise<LikeResponse> {
  const res = await fetch(routes.api.movies.likes(movieId), {
    signal,
    credentials: "same-origin",
  })
  if (!res.ok) {
    const error = await res.text()
    throw new Error(error || "Failed to fetch like status")
  }
  return res.json()
}

async function toggleLike(
  movieId: string,
  liked: boolean,
): Promise<LikeResponse> {
  const url = routes.api.movies.likes(movieId)
  const method = liked ? "DELETE" : "POST"

  const res = await fetch(url, {
    method,
    headers: { "Content-Type": "application/json" },
    credentials: "same-origin",
  })

  if (!res.ok) {
    const error = await res.text()
    throw new Error(error || `Failed to ${liked ? "unlike" : "like"} movie`)
  }

  return res.json()
}

export function useMovieLike(movieId: string) {
  const qc = useQueryClient()
  const queryKey = ["movie-like", movieId]

  const query = useQuery({
    queryKey,
    queryFn: ({ signal }) => fetchLikeStatus(movieId, signal),
    enabled: false, // Don't fetch automatically - use batch status instead
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  })

  const toggleMutation = useMutation({
    mutationFn: ({ liked }: { liked: boolean }) => toggleLike(movieId, liked),
    onMutate: async ({ liked }) => {
      await qc.cancelQueries({ queryKey })
      const previousData = qc.getQueryData<LikeResponse>(queryKey)

      qc.setQueryData<LikeResponse>(queryKey, { liked: !liked })

      return { previousData }
    },
    onError: (error, _variables, context) => {
      if (context?.previousData) {
        qc.setQueryData(queryKey, context.previousData)
      }
      toast.error(error.message || "Failed to update like status")
    },
    onSuccess: (response, { liked }) => {
      const message =
        response.message || (liked ? "Movie unliked" : "Movie liked!")
      toast.success(message)

      // Update the query data with the actual response
      qc.setQueryData<LikeResponse>(queryKey, {
        liked: response.liked,
        action: response.action,
        message: response.message,
      })

      qc.removeQueries({ queryKey: ["movie-recommendations"] })
      qc.invalidateQueries({ queryKey: ["movie-recommendations"] })
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey })
    },
  })

  return {
    ...query,
    liked: query.data?.liked ?? false,
    toggleLike: (liked: boolean) => toggleMutation.mutate({ liked }),
    toggleLikeAsync: (liked: boolean) => toggleMutation.mutateAsync({ liked }),
    isToggling: toggleMutation.isPending,
    error: toggleMutation.error as Error | null,
  }
}
