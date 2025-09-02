import { and, eq } from "drizzle-orm"
import { NextRequest, NextResponse } from "next/server"

import { auth } from "@/lib/auth"
import { db } from "@/lib/database/database"
import { listItems, lists } from "@/lib/database/schema/public"
import { isUUID } from "@/lib/utils/api"

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ identifier: string; movieId: string }> },
) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    })
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { identifier, movieId } = await params
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

    const existingListItem = await db
      .select()
      .from(listItems)
      .where(and(eq(listItems.listId, listId), eq(listItems.movieId, movieId)))
      .limit(1)

    if (existingListItem.length === 0) {
      return NextResponse.json(
        { error: "Item not found in list" },
        { status: 404 },
      )
    }

    await db
      .delete(listItems)
      .where(and(eq(listItems.listId, listId), eq(listItems.movieId, movieId)))

    return NextResponse.json({
      success: true,
      message: "Item successfully removed from list",
    })
  } catch (error) {
    console.error("Error removing item from list:", error)
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    )
  }
}
