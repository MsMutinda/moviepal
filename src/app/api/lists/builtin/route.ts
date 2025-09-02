import { and, eq } from "drizzle-orm"
import { NextResponse } from "next/server"

import { auth } from "@/lib/auth"
import { db } from "@/lib/database/database"
import { lists } from "@/lib/database/schema/public"
import { slugify } from "@/lib/utils/api"

export async function POST(request: Request) {
  const session = await auth.api.getSession({
    headers: request.headers,
  })
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const userId = session.user.id

  const insertBuiltinList = async (
    title: string,
    builtinType: "favorites" | "watch_later",
    slugText: string,
  ) => {
    const slug = slugify(slugText)
    const existing = await db
      .select()
      .from(lists)
      .where(and(eq(lists.userId, userId), eq(lists.slug, slug)))
      .limit(1)

    if (existing.length > 0) return existing[0]

    const [created] = await db
      .insert(lists)
      .values({
        userId,
        title,
        slug,
        isBuiltin: true,
        builtinType,
      })
      .onConflictDoNothing()
      .returning()
    return created
  }

  const favorites = await insertBuiltinList(
    "Favorites",
    "favorites",
    "favorites",
  )
  const watchLater = await insertBuiltinList(
    "Watch later",
    "watch_later",
    "watch-later",
  )

  return NextResponse.json({
    ok: true,
    favorites: favorites,
    watchLater: watchLater,
  })
}

export async function GET(request: Request) {
  const session = await auth.api.getSession({
    headers: request.headers,
  })
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const userLists = await db
    .select()
    .from(lists)
    .where(and(eq(lists.userId, session.user.id), eq(lists.isBuiltin, true)))

  return NextResponse.json(userLists)
}
