import { and, eq } from "drizzle-orm"
import { NextRequest, NextResponse } from "next/server"

import { auth } from "@/lib/auth"
import { db } from "@/lib/database/database"
import { lists } from "@/lib/database/schema/public"
import { slugify } from "@/lib/utils/api"

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    })
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { title } = body

    if (!title || typeof title !== "string") {
      return NextResponse.json({ error: "Title is required" }, { status: 400 })
    }

    const slug = slugify(title)
    const userId = session.user.id

    const existing = await db
      .select()
      .from(lists)
      .where(and(eq(lists.userId, userId), eq(lists.slug, slug)))
      .limit(1)

    if (existing.length > 0) {
      return NextResponse.json(
        { error: "List with this name already exists" },
        { status: 409 },
      )
    }

    const [created] = await db
      .insert(lists)
      .values({
        userId,
        title,
        slug,
        isBuiltin: false,
      })
      .returning()

    return NextResponse.json(created)
  } catch (error) {
    console.error("Error creating list:", error)
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    })
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userLists = await db
      .select()
      .from(lists)
      .where(eq(lists.userId, session.user.id))
    return NextResponse.json(userLists)
  } catch (error) {
    console.error("Error in lists route:", error)
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    })
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const listId = searchParams.get("id")

    if (!listId) {
      return NextResponse.json(
        { error: "List ID is required" },
        { status: 400 },
      )
    }

    const userId = session.user.id

    const existing = await db
      .select()
      .from(lists)
      .where(and(eq(lists.id, listId), eq(lists.userId, userId)))
      .limit(1)

    if (existing.length === 0) {
      return NextResponse.json({ error: "List not found" }, { status: 404 })
    }

    const list = existing[0]

    if (list.isBuiltin) {
      return NextResponse.json(
        { error: "Cannot delete built-in lists" },
        { status: 400 },
      )
    }

    await db
      .delete(lists)
      .where(and(eq(lists.id, listId), eq(lists.userId, userId)))

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting list:", error)
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    )
  }
}
