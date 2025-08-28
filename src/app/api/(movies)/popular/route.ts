import { NextRequest, NextResponse } from "next/server"

import { tmdbService } from "@/services/tmdb.service"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get("page") || "1", 10)

    const popular = await tmdbService.getPopularMovies({
      revalidate: 60,
      query: { page },
    })

    return NextResponse.json({
      page: popular?.page ?? page,
      results: popular?.results ?? [],
      total_pages: popular?.total_pages ?? 0,
      total_results: popular?.total_results ?? 0,
    })
  } catch (error) {
    console.error("Error in popular route:", error)

    return NextResponse.json(
      {
        page: 1,
        results: [],
        total_pages: 0,
        total_results: 0,
        error: "Failed to fetch popular movies",
      },
      { status: 500 },
    )
  }
}
