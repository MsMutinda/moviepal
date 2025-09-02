import { eq } from "drizzle-orm"
import { NextRequest, NextResponse } from "next/server"

import { auth } from "@/lib/auth"
import { db } from "@/lib/database/database"
import { dismissedMovies, movies } from "@/lib/database/schema/public"
import { getOrCreateMovie } from "@/lib/utils/server"

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    })
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    const tmdbId = parseInt(id)
    if (isNaN(tmdbId)) {
      return NextResponse.json({ error: "Invalid movie ID" }, { status: 400 })
    }

    const userId = session.user.id

    const movie = await getOrCreateMovie(tmdbId)
    if (!movie) {
      return NextResponse.json({ error: "Movie not found" }, { status: 404 })
    }

    const existingDismissal = await db
      .select()
      .from(dismissedMovies)
      .where(
        eq(dismissedMovies.userId, userId) &&
          eq(dismissedMovies.movieId, movie.id),
      )
      .limit(1)

    if (existingDismissal.length > 0) {
      return NextResponse.json({ dismissed: true })
    }

    await db.insert(dismissedMovies).values({
      userId,
      movieId: movie.id,
    })

    return NextResponse.json({ dismissed: true })
  } catch (error) {
    console.error("Error dismissing movie:", error)
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    })
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    const tmdbId = parseInt(id)
    if (isNaN(tmdbId)) {
      return NextResponse.json({ error: "Invalid movie ID" }, { status: 400 })
    }

    const userId = session.user.id

    const movie = await db
      .select()
      .from(movies)
      .where(eq(movies.tmdbId, tmdbId))
      .limit(1)

    if (movie.length === 0) {
      return NextResponse.json({ error: "Movie not found" }, { status: 404 })
    }

    await db
      .delete(dismissedMovies)
      .where(
        eq(dismissedMovies.userId, userId) &&
          eq(dismissedMovies.movieId, movie[0].id),
      )

    return NextResponse.json({ dismissed: false })
  } catch (error) {
    console.error("Error undismissing movie:", error)
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    )
  }
}
