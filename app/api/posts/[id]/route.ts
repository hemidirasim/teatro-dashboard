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
  const postId = parseInt(id)

  try {
    const posts = await prisma.$queryRawUnsafe(`
      SELECT 
        p.*,
        pc.title,
        pc.title_sub,
        pc.content,
        pc.post_date,
        pc.lang_id
      FROM \`post\` p
      LEFT JOIN \`post_content\` pc ON p.id = pc.post_id AND pc.lang_id = 'az'
      WHERE p.id = ${postId}
      LIMIT 1
    `)

    if ((posts as any[]).length === 0) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 })
    }

    // Get categories
    const categories = await prisma.$queryRawUnsafe(`
      SELECT category_id FROM \`xref_post_category\` WHERE post_id = ${postId}
    `)

    return NextResponse.json({
      ...(posts as any[])[0],
      category_ids: (categories as any[]).map((c) => c.category_id),
    })
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
  const postId = parseInt(id)

  try {
    const body = await request.json()
    const {
      img_url,
      title,
      title_sub,
      content,
      author,
      sort_order,
      status,
      post_date,
      lang_id,
      category_ids,
    } = body

    // Escape function for SQL strings (MySQL safe)
    const escape = (str: string | null | undefined): string => {
      if (str === null || str === undefined) return "NULL"
      const escaped = String(str)
        .replace(/\\/g, "\\\\")
        .replace(/'/g, "''")
        .replace(/\n/g, "\\n")
        .replace(/\r/g, "\\r")
        .replace(/\t/g, "\\t")
        .replace(/\x00/g, "\\0")
        .replace(/\x1a/g, "\\Z")
      return `'${escaped}'`
    }

    // Update post
    const imgUrlValue = img_url ? escape(img_url) : "''"
    const authorValue = author ? author : "NULL"
    const sortOrderValue = sort_order ? sort_order : "NULL"
    const statusValue = status ?? 1

    await prisma.$executeRawUnsafe(`
      UPDATE \`post\`
      SET 
        img_url = ${imgUrlValue},
        author = ${authorValue},
        sort_order = ${sortOrderValue},
        status = ${statusValue}
      WHERE id = ${postId}
    `)

    // Update or insert post content
    const langIdValue = lang_id ? escape(lang_id) : "'az'"
    const existingContent = await prisma.$queryRawUnsafe<Array<{ id: number }>>(
      `SELECT id FROM \`post_content\` WHERE post_id = ${postId} AND lang_id = ${langIdValue} LIMIT 1`
    )

    const titleValue = title ? escape(title) : "''"
    const titleSubValue = title_sub ? escape(title_sub) : "NULL"
    const contentValue = content ? escape(content) : "''"
    const postDateValue = post_date ? escape(post_date) : "NULL"

    if (existingContent.length > 0) {
      await prisma.$executeRawUnsafe(`
        UPDATE \`post_content\`
        SET 
          title = ${titleValue},
          title_sub = ${titleSubValue},
          content = ${contentValue},
          post_date = ${postDateValue}
        WHERE post_id = ${postId} AND lang_id = ${langIdValue}
      `)
    } else {
      await prisma.$executeRawUnsafe(`
        INSERT INTO \`post_content\` (title, title_sub, content, post_id, post_date, lang_id)
        VALUES (${titleValue}, ${titleSubValue}, ${contentValue}, ${postId}, ${postDateValue}, ${langIdValue})
      `)
    }

    // Update categories
    await prisma.$executeRawUnsafe(`
      DELETE FROM \`xref_post_category\` WHERE post_id = ${postId}
    `)

    if (category_ids && Array.isArray(category_ids) && category_ids.length > 0) {
      const values = category_ids
        .map((catId: number) => `(${postId}, ${catId})`)
        .join(", ")
      await prisma.$executeRawUnsafe(`
        INSERT INTO \`xref_post_category\` (post_id, category_id)
        VALUES ${values}
      `)
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Error updating post:", error)
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
  const postId = parseInt(id)

  try {
    // Delete categories
    await prisma.$executeRawUnsafe(`
      DELETE FROM \`xref_post_category\` WHERE post_id = ${postId}
    `)

    // Delete content
    await prisma.$executeRawUnsafe(`
      DELETE FROM \`post_content\` WHERE post_id = ${postId}
    `)

    // Delete post
    await prisma.$executeRawUnsafe(`
      DELETE FROM \`post\` WHERE id = ${postId}
    `)

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Error deleting post:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

