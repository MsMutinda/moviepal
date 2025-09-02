"use client"

import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { ReactQueryDevtools } from "@tanstack/react-query-devtools"
import { ReactNode, useState } from "react"

interface QueryProviderProps {
  children: ReactNode
  showDevtools?: boolean
}

const createQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 5 * 60_000, // 5 minutes
        gcTime: 10 * 60_000, // 10 minutes (formerly cacheTime)
        retry: (failureCount, error) => {
          // Don't retry on AbortError
          if (error instanceof Error && error.name === "AbortError") {
            return false
          }
          return failureCount < 2
        },
        refetchOnWindowFocus: false,
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
        refetchOnMount: true,
        refetchOnReconnect: true,
      },
      mutations: {
        retry: 2,
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      },
    },
  })

export default function QueryProvider({
  children,
  showDevtools = process.env.NODE_ENV === "development",
}: QueryProviderProps) {
  const [client] = useState(createQueryClient)

  return (
    <QueryClientProvider client={client}>
      {children}
      {showDevtools && <ReactQueryDevtools initialIsOpen={false} />}
    </QueryClientProvider>
  )
}

export { createQueryClient }
