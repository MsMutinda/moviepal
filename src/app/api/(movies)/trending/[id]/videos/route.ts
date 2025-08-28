import { NextRequest, NextResponse } from "next/server"

import { tmdbService } from "@/services/tmdb.service"

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params
    if (!id) {
      return NextResponse.json(
        {
          results: [],
          error: "Movie ID missing",
        },
        { status: 400 },
      )
    }

    const videos = await tmdbService.getMovieDetails(
      parseInt(id),
      false,
      true,
      {
        revalidate: 60,
      },
    )
    if (videos && Array.isArray(videos)) {
      return NextResponse.json({ results: videos })
    } else {
      return NextResponse.json({ results: [] })
    }
  } catch (error) {
    console.error("Error in trending videos route:", error)
    return NextResponse.json({ results: [] })
  }
}
