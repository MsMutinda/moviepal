import { betterAuth } from "better-auth"
import { drizzleAdapter } from "better-auth/adapters/drizzle"

import * as schema from "@/lib/database/schema/auth"
import { db } from "@/lib/database/database"

export const auth = betterAuth({
  database: drizzleAdapter(db, { 
    provider: "pg", 
    schema: {
      user: schema.users,
      session: schema.sessions,
      account: schema.accounts,
    }
  }),
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
  },
  advanced: {
    database: {
      generateId: false,
    },
    cookiePrefix: process.env.NEXT_PUBLIC_AUTH_COOKIE_PREFIX,
  },
})
