import { and, eq } from "drizzle-orm"
import { NextRequest, NextResponse } from "next/server"

import { auth } from "@/lib/auth"
import { db } from "@/lib/database/database"
import { likes } from "@/lib/database/schema/public"
import { createUserRateLimit } from "@/lib/utils/rate-limit"
import { getOrCreateMovie } from "@/lib/utils/server"

const likeRateLimit = createUserRateLimit(60 * 1000, 10) // 10 requests per minute per user

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

    // add user ID to headers for rate limiting
    request.headers.set("x-user-id", session.user.id)

    const rateLimitResult = likeRateLimit(request)
    if (!rateLimitResult.success) {
      return NextResponse.json(
        {
          error: "Too many requests. Please try again later.",
          retryAfter: Math.ceil(
            (rateLimitResult.resetTime - Date.now()) / 1000,
          ),
        },
        {
          status: 429,
          headers: {
            "Retry-After": Math.ceil(
              (rateLimitResult.resetTime - Date.now()) / 1000,
            ).toString(),
            "X-RateLimit-Limit": rateLimitResult.limit.toString(),
            "X-RateLimit-Remaining": rateLimitResult.remaining.toString(),
            "X-RateLimit-Reset": rateLimitResult.resetTime.toString(),
          },
        },
      )
    }

    const { id } = await params
    const userId = session.user.id

    const movie = await getOrCreateMovie(parseInt(id))

    const existingLike = await db
      .select()
      .from(likes)
      .where(and(eq(likes.userId, userId), eq(likes.movieId, movie.id)))
      .limit(1)

    let action: "liked" | "unliked"
    let liked: boolean

    if (existingLike.length === 0) {
      await db.insert(likes).values({
        userId,
        movieId: movie.id,
      })
      action = "liked"
      liked = true
    } else {
      await db
        .delete(likes)
        .where(and(eq(likes.userId, userId), eq(likes.movieId, movie.id)))
      action = "unliked"
      liked = false
    }

    return NextResponse.json(
      {
        success: true,
        action,
        liked,
        message: action === "liked" ? "Movie liked!" : "Movie unliked",
      },
      {
        headers: {
          "X-RateLimit-Limit": rateLimitResult.limit.toString(),
          "X-RateLimit-Remaining": rateLimitResult.remaining.toString(),
          "X-RateLimit-Reset": rateLimitResult.resetTime.toString(),
        },
      },
    )
  } catch (error) {
    console.error("Error toggling like:", error)
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

    // add user ID to headers for rate limiting
    request.headers.set("x-user-id", session.user.id)

    // check rate limit
    const rateLimitResult = likeRateLimit(request)
    if (!rateLimitResult.success) {
      return NextResponse.json(
        {
          error: "Too many requests. Please try again later.",
          retryAfter: Math.ceil(
            (rateLimitResult.resetTime - Date.now()) / 1000,
          ),
        },
        {
          status: 429,
          headers: {
            "Retry-After": Math.ceil(
              (rateLimitResult.resetTime - Date.now()) / 1000,
            ).toString(),
            "X-RateLimit-Limit": rateLimitResult.limit.toString(),
            "X-RateLimit-Remaining": rateLimitResult.remaining.toString(),
            "X-RateLimit-Reset": rateLimitResult.resetTime.toString(),
          },
        },
      )
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

    return NextResponse.json(
      {
        success: true,
        action: "unliked",
        liked: false,
        message: "Movie unliked",
      },
      {
        headers: {
          "X-RateLimit-Limit": rateLimitResult.limit.toString(),
          "X-RateLimit-Remaining": rateLimitResult.remaining.toString(),
          "X-RateLimit-Reset": rateLimitResult.resetTime.toString(),
        },
      },
    )
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
