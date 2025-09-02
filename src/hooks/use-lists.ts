"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

import { routes } from "@/lib/constants"
import type { List } from "@/lib/types"

async function fetchLists(signal?: AbortSignal): Promise<List[]> {
  const res = await fetch(routes.api.lists.custom, {
    signal,
    credentials: "same-origin",
  })
  if (!res.ok) throw new Error("Failed to load lists")
  const lists = await res.json()

  const hasBuiltinLists = lists.some((list: List) => list.isBuiltin)
  if (!hasBuiltinLists) {
    try {
      const builtinRes = await fetch(routes.api.lists.builtin, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
      })
      if (builtinRes.ok) {
        const builtinData = await builtinRes.json()
        return [...lists, builtinData.favorites, builtinData.watchLater]
      }
    } catch (error) {
      console.warn("Failed to create built-in lists automatically:", error)
    }
  }

  return lists
}

async function createCustomList(input: {
  title: string
  slug: string
}): Promise<List> {
  const res = await fetch(routes.api.lists.custom, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "same-origin",
    body: JSON.stringify(input),
  })
  if (!res.ok) {
    const msg = await res.text().catch(() => "")
    throw new Error(msg || "Failed to create list")
  }
  return res.json()
}

async function deleteList(listId: string): Promise<void> {
  const res = await fetch(`${routes.api.lists.custom}?id=${listId}`, {
    method: "DELETE",
    credentials: "same-origin",
  })
  if (!res.ok) {
    const msg = await res.text().catch(() => "")
    throw new Error(msg || "Failed to delete list")
  }
}

export function useLists() {
  const qc = useQueryClient()

  const query = useQuery({
    queryKey: ["lists"],
    queryFn: ({ signal }) => fetchLists(signal),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  })

  const createCustomListMutation = useMutation({
    mutationFn: createCustomList,
    onSuccess: (newList) => {
      qc.setQueryData<List[]>(["lists"], (old) => {
        const existing = old || []
        return [...existing, newList]
      })
      toast.success("List created successfully")
    },
    onError: (error) => {
      toast.error(error.message || "Failed to create list")
    },
  })

  const deleteMutation = useMutation({
    mutationFn: deleteList,
    onSuccess: (_, listId) => {
      qc.setQueryData<List[]>(["lists"], (old) => {
        const existing = old || []
        return existing.filter((list) => list.id !== listId)
      })
      toast.success("List deleted successfully")
    },
    onError: (error) => {
      toast.error(error.message || "Failed to delete list")
    },
  })

  return {
    ...query,
    createCustom: createCustomListMutation.mutate,
    createCustomAsync: createCustomListMutation.mutateAsync,
    isCreatingCustom: createCustomListMutation.isPending,
    errorCreatingCustom: createCustomListMutation.error as Error | null,
    delete: deleteMutation.mutate,
    deleteAsync: deleteMutation.mutateAsync,
    isDeleting: deleteMutation.isPending,
    errorDeleting: deleteMutation.error as Error | null,
  }
}
