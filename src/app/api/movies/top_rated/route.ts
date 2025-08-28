import { NextRequest, NextResponse } from "next/server"

import { tmdbService } from "@/services/tmdb.service"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get("page") || "1", 10)

    const topRated = await tmdbService.getTopRatedMovies({
      revalidate: 60,
      query: { page },
    })

    return NextResponse.json({
      page: topRated?.page ?? page,
      results: topRated?.results ?? [],
      total_pages: topRated?.total_pages ?? 0,
      total_results: topRated?.total_results ?? 0,
    })
  } catch (error) {
    console.error("Error in top_rated route:", error)

    return NextResponse.json(
      {
        page: 1,
        results: [],
        total_pages: 0,
        total_results: 0,
        error: "Failed to fetch top rated movies",
      },
      { status: 500 },
    )
  }
}
