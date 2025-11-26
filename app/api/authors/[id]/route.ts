import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await params
  const authorId = parseInt(id)

  try {
    const authors = await prisma.$queryRawUnsafe(`
      SELECT 
        a.*,
        ac.name_surname,
        ac.post,
        ac.lang_id
      FROM \`author\` a
      LEFT JOIN \`author_content\` ac ON a.id = ac.author_id AND ac.lang_id = 'az'
      WHERE a.id = ${authorId}
      LIMIT 1
    `)

    if ((authors as any[]).length === 0) {
      return NextResponse.json({ error: "Author not found" }, { status: 404 })
    }

    return NextResponse.json((authors as any[])[0])
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await params
  const authorId = parseInt(id)

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

    // Update author
    await prisma.$executeRawUnsafe(`
      UPDATE \`author\`
      SET 
        img_url = ${img_url ? `'${String(img_url).replace(/'/g, "''")}'` : "''"},
        sort_order = ${sort_order || "NULL"},
        status = ${status ?? 1}
      WHERE id = ${authorId}
    `)

    // Update or insert author content
    const existingContent = await prisma.$queryRawUnsafe(`
      SELECT id FROM \`author_content\` 
      WHERE author_id = ${authorId} AND lang_id = ${lang_id ? `'${String(lang_id).replace(/'/g, "''")}'` : "'az'"}
      LIMIT 1
    `)

    if ((existingContent as any[]).length > 0) {
      await prisma.$executeRawUnsafe(`
        UPDATE \`author_content\`
        SET 
          name_surname = ${name_surname ? `'${String(name_surname).replace(/'/g, "''")}'` : "''"},
          post = ${post ? `'${String(post).replace(/'/g, "''")}'` : "NULL"}
        WHERE author_id = ${authorId} AND lang_id = ${lang_id ? `'${String(lang_id).replace(/'/g, "''")}'` : "'az'"}
      `)
    } else {
      await prisma.$executeRawUnsafe(`
        INSERT INTO \`author_content\` (name_surname, post, author_id, lang_id)
        VALUES (
          ${name_surname ? `'${String(name_surname).replace(/'/g, "''")}'` : "''"},
          ${post ? `'${String(post).replace(/'/g, "''")}'` : "NULL"},
          ${authorId},
          ${lang_id ? `'${String(lang_id).replace(/'/g, "''")}'` : "'az'"}
        )
      `)
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Error updating author:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await params
  const authorId = parseInt(id)

  try {
    // Delete content
    await prisma.$executeRawUnsafe(`
      DELETE FROM \`author_content\` WHERE author_id = ${authorId}
    `)

    // Delete author
    await prisma.$executeRawUnsafe(`
      DELETE FROM \`author\` WHERE id = ${authorId}
    `)

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Error deleting author:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

