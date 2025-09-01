import { eq } from "drizzle-orm"
import { NextResponse } from "next/server"

import { auth } from "@/lib/auth"
import { db } from "@/lib/database/database"
import { users } from "@/lib/database/schema/auth"
import { preferencesSchema } from "@/lib/validation"

export async function PATCH(req: Request) {
  const session = await auth.api.getSession({
    headers: req.headers,
  })

  const user = session?.user
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const requestBody = await req.json()
  const parsedRequestBody = preferencesSchema.safeParse(requestBody)
  if (!parsedRequestBody.success) {
    return NextResponse.json(
      { error: parsedRequestBody.error.flatten().fieldErrors },
      { status: 400 },
    )
  }

  const { language, region, genres } = parsedRequestBody.data
  await db
    .update(users)
    .set({ preferences: { language, region, genres }, updatedAt: new Date() })
    .where(eq(users.id, user.id))

  return NextResponse.json({ ok: true })
}

export async function GET(req: Request) {
  const session = await auth.api.getSession({
    headers: req.headers,
  })

  const user = session?.user
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const [row] = await db
    .select({ preferences: users.preferences })
    .from(users)
    .where(eq(users.id, user.id))
    .limit(1)
  return NextResponse.json(row?.preferences ?? {})
}
