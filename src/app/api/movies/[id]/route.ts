import { NextRequest, NextResponse } from "next/server"

import { Credits } from "@/lib/types"
import { tmdbService } from "@/services/tmdb.service"

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
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

    const [movie, credits] = await Promise.all([
      tmdbService.getMovieDetails(movieId),
      tmdbService.getMovieDetails(movieId, false, false, true),
    ])

    if (!movie) {
      return NextResponse.json({ error: "Movie not found" }, { status: 404 })
    }

    const movieWithDetails = {
      ...movie,
      credits: credits as Credits,
    }

    return NextResponse.json(movieWithDetails)
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    )
  }
}
