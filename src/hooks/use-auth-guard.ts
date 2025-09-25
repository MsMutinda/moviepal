"use client"

import { authClient } from "@/lib/clients/auth"

/**
 * Returns the current authentication state
 */
export function useAuthGuard() {
  const { data: session } = authClient.useSession()
  return {
    isAuthenticated: !!session?.user,
    user: session?.user,
    session,
  }
}
