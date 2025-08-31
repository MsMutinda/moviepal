"use client"

import { QueryClient } from "@tanstack/react-query"

let client: QueryClient | null = null
export function getQueryClient() {
  if (!client) {
    client = new QueryClient({
      defaultOptions: {
        queries: {
          staleTime: 5 * 60_000,
          gcTime: 10 * 60_000,
          refetchOnWindowFocus: false,
          retry: 2,
        },
      },
    })
  }

  return client
}
