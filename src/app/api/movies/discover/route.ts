import { NextRequest, NextResponse } from "next/server"

import { tmdbService } from "@/services/tmdb.service"

export async function GET(request: NextRequest) {
  let response: NextResponse

  try {
    const { searchParams } = new URL(request.url)
    const params: Record<string, string> = {}
    for (const [key, value] of searchParams.entries()) {
      if (value) {
        params[key] = value
      }
    }

    const data = await tmdbService.discoverMovies({
      query: params,
    })
    if (data && data.results) {
      response = NextResponse.json(data)
    } else {
      response = NextResponse.json({
        page: 1,
        results: [],
        total_pages: 0,
        total_results: 0,
      })
    }
  } catch {
    response = NextResponse.json({
      page: 1,
      results: [],
      total_pages: 0,
      total_results: 0,
    })
  }

  response.headers.set("Cache-Control", "no-cache, no-store, must-revalidate")
  response.headers.set("Pragma", "no-cache")
  response.headers.set("Expires", "0")
  return response
}
