import { NextRequest, NextResponse } from "next/server"

import { tmdbService } from "@/services/tmdb.service"

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  let response: NextResponse | null = null

  try {
    if (!id) {
      return NextResponse.json(
        {
          results: [],
          error: "Movie ID missing",
        },
        { status: 400 },
      )
    }

    const movieId = parseInt(id)
    if (isNaN(movieId)) {
      return NextResponse.json({ error: "Invalid movie ID" }, { status: 400 })
    }

    const videos = await tmdbService.getMovieDetails(
      movieId,
      false,
      true,
      false,
      {
        revalidate: 60,
      },
    )

    if (videos && typeof videos === "object" && "results" in videos) {
      response = NextResponse.json({
        id: movieId,
        results: videos.results || [],
      })
    } else {
      response = NextResponse.json({
        id: movieId,
        results: [],
      })
    }
  } catch (error) {
    response = NextResponse.json({
      id: id,
      results: [],
      error: error instanceof Error ? error.message : "Unknown error",
    })
  }

  response.headers.set("Cache-Control", "no-cache, no-store, must-revalidate")
  response.headers.set("Pragma", "no-cache")
  response.headers.set("Expires", "0")
  return response
}
