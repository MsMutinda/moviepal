import { NextRequest, NextResponse } from "next/server"

import { tmdbService } from "@/services/tmdb.service"

export async function GET(_request: NextRequest) {
  try {
    const genres = await tmdbService.getGenres()
    if (genres && genres.genres) {
      return NextResponse.json(genres)
    } else {
      return NextResponse.json({
        genres: [],
      })
    }
  } catch (error) {
    console.error("Error in genres route:", error)
    return NextResponse.json({
      genres: [],
    })
  }
}
