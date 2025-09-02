import { defineConfig } from "drizzle-kit"

export default defineConfig({
  schema: [
    "src/lib/database/schema/auth.ts",
    "src/lib/database/schema/public.ts",
  ],
  out: "src/lib/database/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
  schemaFilter: ["auth", "public"],
})
