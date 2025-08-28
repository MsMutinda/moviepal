import { NextRequest, NextResponse } from "next/server"

import { tmdbService } from "@/services/tmdb.service"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get("page") || "1", 10)

    const trending = await tmdbService.getTrendingMovies({
      revalidate: 60,
      query: { page },
    })

    return NextResponse.json({
      page: trending?.page ?? page,
      results: trending?.results ?? [],
      total_pages: trending?.total_pages ?? 0,
      total_results: trending?.total_results ?? 0,
    })
  } catch (error) {
    console.error("Error in trending route:", error)

    return NextResponse.json(
      {
        page: 1,
        results: [],
        total_pages: 0,
        total_results: 0,
        error: "Failed to fetch trending movies",
      },
      { status: 500 },
    )
  }
}
