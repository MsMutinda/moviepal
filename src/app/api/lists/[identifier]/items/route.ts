import { and, desc, eq, like } from "drizzle-orm"
import { NextRequest, NextResponse } from "next/server"

import { auth } from "@/lib/auth"
import { db } from "@/lib/database/database"
import { listItems, lists, movies } from "@/lib/database/schema/public"
import { Movie } from "@/lib/types"
import { isUUID } from "@/lib/utils/api"
import { tmdbService } from "@/services/tmdb.service"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ identifier: string }> },
) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    })
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { identifier } = await params
    const userId = session.user.id
    const { searchParams } = new URL(request.url)

    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "20")
    const search = searchParams.get("search") || ""

    const offset = (page - 1) * limit

    const existingList = await db
      .select()
      .from(lists)
      .where(
        and(
          isUUID(identifier)
            ? eq(lists.id, identifier)
            : eq(lists.slug, identifier),
          eq(lists.userId, userId),
        ),
      )
      .limit(1)

    if (existingList.length === 0) {
      return NextResponse.json({ error: "List not found" }, { status: 404 })
    }

    const listId = existingList[0].id

    const searchConditions = search
      ? like(movies.title, `%${search}%`)
      : undefined

    const totalCountResult = await db
      .select({ count: movies.id })
      .from(listItems)
      .innerJoin(movies, eq(listItems.movieId, movies.id))
      .where(and(eq(listItems.listId, listId), searchConditions))

    const totalCount = totalCountResult.length

    const items = await db
      .select({
        id: listItems.listId,
        movieId: listItems.movieId,
        addedAt: listItems.createdAt,
        movie: {
          tmdbId: movies.tmdbId,
          title: movies.title,
          year: movies.year,
          metadata: movies.metadata,
        },
      })
      .from(listItems)
      .innerJoin(movies, eq(listItems.movieId, movies.id))
      .where(and(eq(listItems.listId, listId), searchConditions))
      .orderBy(desc(listItems.createdAt))
      .limit(limit)
      .offset(offset)

    return NextResponse.json({
      items,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit),
        hasNext: page < Math.ceil(totalCount / limit),
        hasPrev: page > 1,
      },
    })
  } catch {
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ identifier: string }> },
) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    })
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { identifier } = await params
    const body = await request.json()
    const { movieId: tmdbId } = body

    if (!tmdbId) {
      return NextResponse.json(
        { error: "Movie ID is required" },
        { status: 400 },
      )
    }

    const userId = session.user.id

    const existingList = await db
      .select()
      .from(lists)
      .where(
        and(
          isUUID(identifier)
            ? eq(lists.id, identifier)
            : eq(lists.slug, identifier),
          eq(lists.userId, userId),
        ),
      )
      .limit(1)

    if (existingList.length === 0) {
      return NextResponse.json({ error: "List not found" }, { status: 404 })
    }

    const listId = existingList[0].id

    let movie = await db
      .select()
      .from(movies)
      .where(eq(movies.tmdbId, parseInt(tmdbId)))
      .limit(1)

    if (movie.length === 0) {
      const tmdbMovie = (await tmdbService.getMovieDetails(
        parseInt(tmdbId),
      )) as Movie
      if (!tmdbMovie) {
        return NextResponse.json(
          { error: "Movie not found in TMDB" },
          { status: 404 },
        )
      }

      const [newMovie] = await db
        .insert(movies)
        .values({
          tmdbId: parseInt(tmdbId),
          title: tmdbMovie.title,
          year: tmdbMovie.release_date
            ? new Date(tmdbMovie.release_date).getFullYear()
            : null,
          metadata: {
            poster_path: tmdbMovie.poster_path,
            backdrop_path: tmdbMovie.backdrop_path,
            vote_average: tmdbMovie.vote_average,
            release_date: tmdbMovie.release_date,
          },
        })
        .returning()
      movie = [newMovie]
    }

    const movieId = movie[0].id

    await db
      .insert(listItems)
      .values({
        listId,
        movieId,
      })
      .onConflictDoNothing()

    return NextResponse.json({ success: true, message: "Item added to list" })
  } catch {
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    )
  }
}
