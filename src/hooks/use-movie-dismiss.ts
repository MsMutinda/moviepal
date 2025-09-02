"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

import { routes } from "@/lib/constants"

async function dismissMovie(movieId: string): Promise<void> {
  const res = await fetch(routes.api.movies.dismiss(movieId), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "same-origin",
  })

  if (!res.ok) {
    const error = await res.text()
    throw new Error(error || "Failed to dismiss movie")
  }
}

async function undismissMovie(movieId: string): Promise<void> {
  const res = await fetch(routes.api.movies.dismiss(movieId), {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    credentials: "same-origin",
  })

  if (!res.ok) {
    const error = await res.text()
    throw new Error(error || "Failed to undismiss movie")
  }
}

export function useMovieDismiss(movieId: string) {
  const queryClient = useQueryClient()

  const dismissMutation = useMutation({
    mutationFn: () => dismissMovie(movieId),
    onSuccess: () => {
      queryClient.removeQueries({ queryKey: ["movie-recommendations"] })
      queryClient.invalidateQueries({ queryKey: ["movie-recommendations"] })
      queryClient.refetchQueries({ queryKey: ["movie-recommendations"] })
      toast.success("Movie dismissed from recommendations")
    },
    onError: (error) => {
      toast.error(error.message || "Failed to dismiss movie")
    },
  })

  const undismissMutation = useMutation({
    mutationFn: () => undismissMovie(movieId),
    onSuccess: () => {
      queryClient.removeQueries({ queryKey: ["movie-recommendations"] })
      queryClient.invalidateQueries({ queryKey: ["movie-recommendations"] })
      queryClient.refetchQueries({ queryKey: ["movie-recommendations"] })
      toast.success("Movie restored to recommendations")
    },
    onError: (error) => {
      toast.error(error.message || "Failed to restore movie")
    },
  })

  return {
    dismissMovie: () => dismissMutation.mutate(),
    undismissMovie: () => undismissMutation.mutate(),
    isDismissing: dismissMutation.isPending,
    isUndismissing: undismissMutation.isPending,
    error: dismissMutation.error || undismissMutation.error,
  }
}
