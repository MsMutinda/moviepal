import { and, eq } from "drizzle-orm"
import { NextRequest, NextResponse } from "next/server"

import { auth } from "@/lib/auth"
import { db } from "@/lib/database/database"
import { ratings } from "@/lib/database/schema/public"
import { getOrCreateMovie } from "@/lib/utils/server"

export async function GET(
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
    const userId = session.user.id

    const movie = await getOrCreateMovie(parseInt(id))

    const rating = await db
      .select()
      .from(ratings)
      .where(and(eq(ratings.userId, userId), eq(ratings.movieId, movie.id)))
      .limit(1)

    return NextResponse.json({
      rating: rating.length > 0 ? rating[0].score : null,
    })
  } catch (error) {
    if (error instanceof Error && error.message === "Movie not found in TMDB") {
      return NextResponse.json({ error: "Movie not found" }, { status: 404 })
    }
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    )
  }
}

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
    const userId = session.user.id
    const body = await request.json()
    const { score } = body

    if (!score || typeof score !== "number" || score < 1 || score > 10) {
      return NextResponse.json(
        { error: "Score must be a number between 1 and 10" },
        { status: 400 },
      )
    }

    const movie = await getOrCreateMovie(parseInt(id))

    const existingRating = await db
      .select()
      .from(ratings)
      .where(and(eq(ratings.userId, userId), eq(ratings.movieId, movie.id)))
      .limit(1)

    if (existingRating.length > 0) {
      const [updated] = await db
        .update(ratings)
        .set({ score, updatedAt: new Date() })
        .where(and(eq(ratings.userId, userId), eq(ratings.movieId, movie.id)))
        .returning()

      return NextResponse.json({ success: true, rating: updated })
    } else {
      const [created] = await db
        .insert(ratings)
        .values({
          userId,
          movieId: movie.id,
          score,
        })
        .returning()

      return NextResponse.json({ success: true, rating: created })
    }
  } catch (error) {
    if (error instanceof Error && error.message === "Movie not found in TMDB") {
      return NextResponse.json({ error: "Movie not found" }, { status: 404 })
    }
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
    const userId = session.user.id

    const movie = await getOrCreateMovie(parseInt(id))

    const result = await db
      .delete(ratings)
      .where(and(eq(ratings.userId, userId), eq(ratings.movieId, movie.id)))
      .returning()

    if (result.length === 0) {
      return NextResponse.json({ error: "Rating not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof Error && error.message === "Movie not found in TMDB") {
      return NextResponse.json({ error: "Movie not found" }, { status: 404 })
    }
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    )
  }
}
