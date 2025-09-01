"use client"

import { ArrowLeft } from "lucide-react"
import { redirect } from "next/navigation"
import { useRouter } from "next/navigation"
import { useEffect, useMemo, useState } from "react"

import { LanguagesDropdown } from "@/components/languages-dropdown"
import { RegionsDropdown } from "@/components/regions-dropdown"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { useLandingPageData } from "@/hooks/use-tmdb-data"
import { useUserPreferences } from "@/hooks/use-user-preferences"
import { authClient } from "@/lib/clients/auth"
import { routes } from "@/lib/constants"
import { UserPreferences } from "@/lib/types"

const defaultPreferences: UserPreferences = {
  language: "en-US",
  region: "US",
  genres: [],
}

export default function ProfilePage() {
  const { data: session } = authClient.useSession()
  if (!session?.user) redirect(routes.auth.signin)

  const router = useRouter()

  const { genres } = useLandingPageData()

  const { data, isLoading, error, save, isSaving, errorSaving } =
    useUserPreferences()

  // keep a local draft to avoid updating on every keystroke
  const [draft, setDraft] = useState<UserPreferences>(defaultPreferences)
  useEffect(() => {
    if (data) setDraft({ ...defaultPreferences, ...data })
  }, [data])

  const canSubmit = useMemo(() => !!draft.language, [draft.language])

  function toggleGenre(id: number) {
    setDraft((p) => {
      const current = new Set(p.genres ?? [])
      if (current.has(id)) current.delete(id)
      else current.add(id)
      return { ...p, genres: Array.from(current) }
    })
  }

  if (isLoading) {
    return (
      <div className="text-sm text-gray-500">Loading your preferences…</div>
    )
  }

  if (error) {
    return (
      <div className="text-sm text-red-600">
        Failed to load: {(error as Error).message}
      </div>
    )
  }

  return (
    <div className="bg-background flex min-h-screen p-6">
      <div className="from-primary/5 via-background to-accent/5 absolute inset-0 bg-gradient-to-br" />

      <div className="relative w-full max-w-full space-y-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.back()}
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>

        <Card className="border-border/50">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold">
              Account Preferences
            </CardTitle>
            <CardDescription>
              Choose your language and other settings.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form
              className="space-y-6"
              onSubmit={(e) => {
                e.preventDefault()
                save(draft)
              }}
            >
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <label className="flex flex-col gap-1">
                  <span className="text-sm font-medium">Language</span>
                  <LanguagesDropdown
                    value={draft.language}
                    onValueChange={(value: string) =>
                      setDraft({ ...draft, language: value })
                    }
                  />
                </label>

                <label className="flex flex-col gap-1">
                  <span className="text-sm font-medium">Region</span>
                  <RegionsDropdown
                    value={draft.region}
                    onValueChange={(value: string) =>
                      setDraft({ ...draft, region: value })
                    }
                  />
                </label>
              </div>

              <fieldset className="rounded border p-3">
                <legend className="px-1 text-sm font-medium">
                  Favorite genres
                </legend>
                <div className="mt-2 flex flex-wrap gap-2">
                  {genres.map((g) => {
                    const selected = (draft.genres ?? []).includes(g.id)
                    return (
                      <Button
                        type="button"
                        key={g.id}
                        onClick={() => toggleGenre(g.id)}
                        className={`rounded border px-3 py-1 text-sm ${selected ? "bg-[#009A9C] text-white" : "bg-white"}`}
                        aria-pressed={selected}
                      >
                        {g.name}
                      </Button>
                    )
                  })}
                </div>
                <p className="mt-2 text-xs text-gray-500">
                  We&apos;ll prioritize these in your personalized
                  recommendations.
                </p>
              </fieldset>

              {/* Error Message */}
              {errorSaving && (
                <div className="rounded-md border border-red-200 bg-red-50 p-4">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <svg
                        className="h-5 w-5 text-red-400"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-red-800">
                        Failed to save preferences
                      </p>
                      <p className="mt-1 text-sm text-red-700">
                        {errorSaving.message}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-3">
                <Button
                  variant="default"
                  size="lg"
                  type="submit"
                  disabled={!canSubmit || isSaving}
                  className="rounded bg-[#009A9C] px-4 py-2 text-white hover:bg-[#009A9C]/90 disabled:opacity-50"
                >
                  {isSaving ? "Saving…" : "Save Preferences"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
