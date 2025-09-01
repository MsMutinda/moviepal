import { z } from "zod"

export const preferencesSchema = z.object({
  language: z.string().min(2).max(5),
  region: z.string().length(2).optional(),
  genres: z.array(z.number().int().nonnegative()).max(50).default([]),
})

export type PreferencesInput = z.infer<typeof preferencesSchema>
