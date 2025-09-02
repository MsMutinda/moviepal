import { and, eq, inArray } from "drizzle-orm"
import { NextRequest, NextResponse } from "next/server"

import { auth } from "@/lib/auth"
import { db } from "@/lib/database/database"
import { likes, ratings } from "@/lib/database/schema/public"
import { LocalMovie } from "@/lib/types"
import { getOrCreateMovie } from "@/lib/utils/server"

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    })
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { movieIds } = body

    if (!movieIds || !Array.isArray(movieIds) || movieIds.length === 0) {
      return NextResponse.json(
        { error: "Movie IDs array is required" },
        { status: 400 },
      )
    }

    if (movieIds.length > 50) {
      return NextResponse.json(
        { error: "Too many movie IDs (max 50)" },
        { status: 400 },
      )
    }

    const userId = session.user.id
    const tmdbIds = movieIds.map((id) => parseInt(id))

    const moviePromises = tmdbIds.map((tmdbId) => getOrCreateMovie(tmdbId))
    const movieResults = await Promise.allSettled(moviePromises)

    const validMovies = movieResults
      .filter((result) => result.status === "fulfilled")
      .map((result) => (result as PromiseFulfilledResult<LocalMovie>).value)

    if (validMovies.length === 0) {
      return NextResponse.json({ movies: {} })
    }

    const movieIds_db = validMovies.map((movie) => movie.id)

    const [likesData, ratingsData] = await Promise.all([
      db
        .select({
          movieId: likes.movieId,
        })
        .from(likes)
        .where(
          and(eq(likes.userId, userId), inArray(likes.movieId, movieIds_db)),
        ),
      db
        .select({
          movieId: ratings.movieId,
          score: ratings.score,
        })
        .from(ratings)
        .where(
          and(
            eq(ratings.userId, userId),
            inArray(ratings.movieId, movieIds_db),
          ),
        ),
    ])

    const likedMovies = new Set(likesData.map((like) => like.movieId))
    const movieRatings = new Map(
      ratingsData.map((rating) => [rating.movieId, rating.score]),
    )

    const response: Record<string, { liked: boolean; rating: number | null }> =
      {}

    validMovies.forEach((movie) => {
      response[movie.tmdbId.toString()] = {
        liked: likedMovies.has(movie.id),
        rating: movieRatings.get(movie.id) || null,
      }
    })

    return NextResponse.json({ movies: response })
  } catch (error) {
    console.error("Error fetching batch movie status:", error)
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    )
  }
}
