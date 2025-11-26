import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const authors = await prisma.$queryRawUnsafe(`
      SELECT 
        a.id,
        a.img_url,
        a.count,
        a.sort_order,
        a.status,
        ac.name_surname,
        ac.post,
        ac.lang_id
      FROM \`author\` a
      LEFT JOIN \`author_content\` ac ON a.id = ac.author_id AND ac.lang_id = 'az'
      ORDER BY a.id DESC
    `)

    return NextResponse.json({ data: authors })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const body = await request.json()
    const {
      img_url,
      name_surname,
      post,
      sort_order,
      status,
      lang_id,
    } = body

    // Insert author
    const authorResult = await prisma.$executeRawUnsafe(`
      INSERT INTO \`author\` (img_url, sort_order, status, count)
      VALUES (
        ${img_url ? `'${String(img_url).replace(/'/g, "''")}'` : "''"},
        ${sort_order || "NULL"},
        ${status ?? 1},
        0
      )
    `)

    // Get inserted author ID
    const authorIdResult = await prisma.$queryRawUnsafe(`
      SELECT LAST_INSERT_ID() as id
    `)
    const authorId = (authorIdResult as any[])[0]?.id

    if (!authorId) {
      throw new Error("Failed to get author ID")
    }

    // Insert author content
    await prisma.$executeRawUnsafe(`
      INSERT INTO \`author_content\` (name_surname, post, author_id, lang_id)
      VALUES (
        ${name_surname ? `'${String(name_surname).replace(/'/g, "''")}'` : "''"},
        ${post ? `'${String(post).replace(/'/g, "''")}'` : "NULL"},
        ${authorId},
        ${lang_id ? `'${String(lang_id).replace(/'/g, "''")}'` : "'az'"}
      )
    `)

    return NextResponse.json({ success: true, id: authorId })
  } catch (error: any) {
    console.error("Error creating author:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

