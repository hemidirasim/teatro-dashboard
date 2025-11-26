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

    // Update post
    await prisma.$executeRawUnsafe(`
      UPDATE \`post\`
      SET 
        img_url = ${img_url ? `'${String(img_url).replace(/'/g, "''")}'` : "''"},
        author = ${author || "NULL"},
        sort_order = ${sort_order || "NULL"},
        status = ${status ?? 1}
      WHERE id = ${postId}
    `)

    // Update or insert post content
    const existingContent = await prisma.$queryRawUnsafe(`
      SELECT id FROM \`post_content\` 
      WHERE post_id = ${postId} AND lang_id = ${lang_id ? `'${String(lang_id).replace(/'/g, "''")}'` : "'az'"}
      LIMIT 1
    `)

    if ((existingContent as any[]).length > 0) {
      await prisma.$executeRawUnsafe(`
        UPDATE \`post_content\`
        SET 
          title = ${title ? `'${String(title).replace(/'/g, "''")}'` : "''"},
          title_sub = ${title_sub ? `'${String(title_sub).replace(/'/g, "''")}'` : "NULL"},
          content = ${content ? `'${String(content).replace(/'/g, "''")}'` : "''"},
          post_date = ${post_date ? `'${String(post_date).replace(/'/g, "''")}'` : "NULL"}
        WHERE post_id = ${postId} AND lang_id = ${lang_id ? `'${String(lang_id).replace(/'/g, "''")}'` : "'az'"}
      `)
    } else {
      await prisma.$executeRawUnsafe(`
        INSERT INTO \`post_content\` (title, title_sub, content, post_id, post_date, lang_id)
        VALUES (
          ${title ? `'${String(title).replace(/'/g, "''")}'` : "''"},
          ${title_sub ? `'${String(title_sub).replace(/'/g, "''")}'` : "NULL"},
          ${content ? `'${String(content).replace(/'/g, "''")}'` : "''"},
          ${postId},
          ${post_date ? `'${String(post_date).replace(/'/g, "''")}'` : "NULL"},
          ${lang_id ? `'${String(lang_id).replace(/'/g, "''")}'` : "'az'"}
        )
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

