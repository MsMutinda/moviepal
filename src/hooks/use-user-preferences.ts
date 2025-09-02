"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

import { routes } from "@/lib/constants"
import type { UserPreferences } from "@/lib/types"

async function fetchPreferences(
  signal?: AbortSignal,
): Promise<UserPreferences> {
  const res = await fetch(routes.api.account.preferences, {
    signal,
    credentials: "same-origin",
  })
  if (!res.ok) throw new Error("Failed to load preferences")
  return res.json()
}

async function patchPreferences(
  input: UserPreferences,
): Promise<UserPreferences> {
  const res = await fetch(routes.api.account.preferences, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    credentials: "same-origin",
    body: JSON.stringify(input),
  })
  if (!res.ok) {
    const msg = await res.text().catch(() => "")
    throw new Error(msg || "Failed to save preferences")
  }
  return input
}

export function useUserPreferences() {
  const qc = useQueryClient()

  const query = useQuery({
    queryKey: ["user-prefs"],
    queryFn: ({ signal }) => fetchPreferences(signal),
    staleTime: 0,
    gcTime: 0,
  })

  const mutation = useMutation({
    mutationFn: patchPreferences,
    onMutate: async (next) => {
      await qc.cancelQueries({ queryKey: ["user-prefs"] })
      const prev = qc.getQueryData<UserPreferences>(["user-prefs"])
      qc.setQueryData<UserPreferences>(["user-prefs"], (old) => ({
        ...(old ?? {}),
        ...next,
      }))
      return { prev }
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) qc.setQueryData(["user-prefs"], ctx.prev)
    },
    onSuccess: () => {
      toast.success("Preferences saved successfully")
      qc.removeQueries({ queryKey: ["movie-recommendations"] })
      qc.invalidateQueries({ queryKey: ["movie-recommendations"] })
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ["user-prefs"] })
    },
  })

  return {
    ...query,
    save: mutation.mutate,
    saveAsync: mutation.mutateAsync,
    isSaving: mutation.isPending,
    errorSaving: mutation.error as Error | null,
    isSuccess: mutation.isSuccess,
    reset: mutation.reset,
  }
}
