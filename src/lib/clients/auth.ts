import { createAuthClient } from "better-auth/react"

export const authClient = createAuthClient({
    baseURL: process.env.NEXT_PUBLIC_BASE_URL,
    advanced: {
        cookiePrefix: process.env.NEXT_PUBLIC_AUTH_COOKIE_PREFIX
    }
})
