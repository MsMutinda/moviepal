"use client"

import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query"
import { toast } from "sonner"

import { routes } from "@/lib/constants"
import type { List } from "@/lib/types"
import { ListItemsResponse } from "@/lib/types"

interface AddItemParams {
  listId: string
  movieId: string
  movieTitle: string
}

interface CreateListAndAddItemParams {
  title: string
  movieId: string
  movieTitle: string
}

async function fetchListItems(
  slug: string,
  page: number = 1,
  search: string = "",
): Promise<ListItemsResponse> {
  const searchParams = new URLSearchParams({
    page: page.toString(),
    limit: "20",
    ...(search && { search }),
  })

  const res = await fetch(`${routes.api.lists.items(slug)}?${searchParams}`, {
    credentials: "same-origin",
  })

  if (!res.ok) throw new Error("Failed to load list items")
  return res.json()
}

async function addListItem({ listId, movieId }: AddItemParams): Promise<void> {
  const res = await fetch(routes.api.lists.items(listId), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "same-origin",
    body: JSON.stringify({ movieId }),
  })
  if (!res.ok) {
    const msg = await res.text().catch(() => "")
    throw new Error(msg || "Failed to add movie to list")
  }
}

async function removeItemFromList({
  listId,
  movieId,
}: {
  listId: string
  movieId: string
}): Promise<void> {
  const res = await fetch(routes.api.lists.item(listId, movieId), {
    method: "DELETE",
    credentials: "same-origin",
  })
  if (!res.ok) {
    const msg = await res.text().catch(() => "")
    throw new Error(msg || "Failed to remove movie from list")
  }
}

async function createListAndAddItem({
  title,
  movieId,
  movieTitle,
}: CreateListAndAddItemParams): Promise<List> {
  const createRes = await fetch(routes.api.lists.custom, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "same-origin",
    body: JSON.stringify({ title }),
  })
  if (!createRes.ok) {
    const msg = await createRes.text().catch(() => "")
    throw new Error(msg || "Failed to create list")
  }

  const newList = await createRes.json()

  await addListItem({ listId: newList.id, movieId, movieTitle })

  return newList
}

export function useListItems(slug: string, search: string = "") {
  const qc = useQueryClient()

  const query = useInfiniteQuery({
    queryKey: ["list-items", slug, search],
    queryFn: ({ pageParam = 1 }) => fetchListItems(slug, pageParam, search),
    getNextPageParam: (lastPage) => {
      return lastPage.pagination.hasNext
        ? lastPage.pagination.page + 1
        : undefined
    },
    initialPageParam: 1,
  })

  const removeItemMutation = useMutation({
    mutationFn: ({ listId, movieId }: { listId: string; movieId: string }) =>
      removeItemFromList({ listId, movieId }),
    onSuccess: (_) => {
      qc.invalidateQueries({ queryKey: ["list-items"] })
      qc.invalidateQueries({ queryKey: ["lists"] })
      qc.removeQueries({ queryKey: ["movie-recommendations"] })
      qc.invalidateQueries({ queryKey: ["movie-recommendations"] })
      toast.success("Item removed from list")
    },
    onError: (error) => {
      toast.error(error.message || "Failed to remove item from list")
    },
  })

  const allItems = query.data?.pages.flatMap((page) => page.items) || []

  return {
    items: allItems,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    hasNextPage: query.hasNextPage,
    fetchNextPage: query.fetchNextPage,
    isFetchingNextPage: query.isFetchingNextPage,
    removeItem: removeItemMutation.mutate,
    removeItemAsync: removeItemMutation.mutateAsync,
    isRemovingItem: removeItemMutation.isPending,
    errorRemovingItem: removeItemMutation.error as Error | null,
  }
}

export function useListItemsMutations() {
  const qc = useQueryClient()

  const addListItemMutation = useMutation({
    mutationFn: addListItem,
    onSuccess: (_, { movieTitle }) => {
      toast.success(`Added "${movieTitle}" to list`)
      qc.invalidateQueries({ queryKey: ["lists"] })
      qc.removeQueries({ queryKey: ["movie-recommendations"] })
      qc.invalidateQueries({ queryKey: ["movie-recommendations"] })
    },
    onError: (error) => {
      toast.error(error.message || "Failed to add movie to list")
    },
  })

  const removeListItemMutation = useMutation({
    mutationFn: removeItemFromList,
    onSuccess: (_) => {
      toast.success(`Removed item from list`)
      qc.invalidateQueries({ queryKey: ["lists"] })
      qc.removeQueries({ queryKey: ["movie-recommendations"] })
      qc.invalidateQueries({ queryKey: ["movie-recommendations"] })
    },
    onError: (error) => {
      toast.error(error.message || "Failed to remove item from list")
    },
  })

  const createListAndAddItemMutation = useMutation({
    mutationFn: createListAndAddItem,
    onSuccess: (newList, { movieTitle }) => {
      toast.success(`Created list "${newList.title}" and added "${movieTitle}"`)
      qc.invalidateQueries({ queryKey: ["lists"] })
      qc.removeQueries({ queryKey: ["movie-recommendations"] })
      qc.invalidateQueries({ queryKey: ["movie-recommendations"] })
    },
    onError: (error) => {
      toast.error(error.message || "Failed to create list and add item")
    },
  })

  return {
    addListItem: addListItemMutation.mutate,
    addListItemAsync: addListItemMutation.mutateAsync,
    isAddingListItem: addListItemMutation.isPending,
    errorAddingListItem: addListItemMutation.error as Error | null,

    removeListItem: removeListItemMutation.mutate,
    removeListItemAsync: removeListItemMutation.mutateAsync,
    isRemovingListItem: removeListItemMutation.isPending,
    errorRemovingListItem: removeListItemMutation.error as Error | null,

    createListAndAddItem: createListAndAddItemMutation.mutate,
    createListAndAddItemAsync: createListAndAddItemMutation.mutateAsync,
    isCreatingListAndAddingItem: createListAndAddItemMutation.isPending,
    errorCreatingListAndAddingItem:
      createListAndAddItemMutation.error as Error | null,
  }
}
