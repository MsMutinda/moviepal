import { and, eq } from "drizzle-orm"
import { NextRequest, NextResponse } from "next/server"

import { auth } from "@/lib/auth"
import { db } from "@/lib/database/database"
import { likes } from "@/lib/database/schema/public"
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

    const like = await db
      .select()
      .from(likes)
      .where(and(eq(likes.userId, userId), eq(likes.movieId, movie.id)))
      .limit(1)

    return NextResponse.json({ liked: like.length > 0 })
  } catch (error) {
    console.error("Error checking like status:", error)
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

    const movie = await getOrCreateMovie(parseInt(id))

    const existingLike = await db
      .select()
      .from(likes)
      .where(and(eq(likes.userId, userId), eq(likes.movieId, movie.id)))
      .limit(1)

    if (existingLike.length > 0) {
      return NextResponse.json(
        { error: "Movie already liked" },
        { status: 409 },
      )
    }

    await db.insert(likes).values({
      userId,
      movieId: movie.id,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error adding like:", error)
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
      .delete(likes)
      .where(and(eq(likes.userId, userId), eq(likes.movieId, movie.id)))
      .returning()

    if (result.length === 0) {
      return NextResponse.json({ error: "Like not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error removing like:", error)
    if (error instanceof Error && error.message === "Movie not found in TMDB") {
      return NextResponse.json({ error: "Movie not found" }, { status: 404 })
    }
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    )
  }
}
