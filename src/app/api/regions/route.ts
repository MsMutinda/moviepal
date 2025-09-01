import { NextRequest, NextResponse } from "next/server"

import { tmdbService } from "@/services/tmdb.service"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "50")

    const data = await tmdbService.getRegions(page, limit)
    if (!data || !data.results) {
      return NextResponse.json({
        results: [],
        page: 1,
        total_pages: 1,
        total_results: 0,
      })
    }
    return NextResponse.json(data)
  } catch (error) {
    console.error("Error in regions route:", error)
    return NextResponse.json({
      results: [],
      page: 1,
      total_pages: 1,
      total_results: 0,
    })
  }
}
