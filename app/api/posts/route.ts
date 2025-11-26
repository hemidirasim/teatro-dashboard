import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const page = parseInt(searchParams.get("page") || "1")
  const pageSize = parseInt(searchParams.get("pageSize") || "50")
  const offset = (page - 1) * pageSize

  try {
    const posts = await prisma.$queryRawUnsafe(`
      SELECT 
        p.id,
        p.img_url,
        p.author,
        p.sort_order,
        p.status,
        p.view,
        pc.title,
        pc.post_date,
        pc.lang_id
      FROM \`post\` p
      LEFT JOIN \`post_content\` pc ON p.id = pc.post_id AND pc.lang_id = 'az'
      ORDER BY p.id DESC
      LIMIT ${pageSize} OFFSET ${offset}
    `)

    const total = await prisma.$queryRawUnsafe(`
      SELECT COUNT(*) as count FROM \`post\`
    `)

    return NextResponse.json({
      data: posts,
      total: (total as any[])[0]?.count || 0,
      page,
      pageSize,
    })
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

    // Insert post
    const postResult = await prisma.$executeRawUnsafe(`
      INSERT INTO \`post\` (img_url, author, sort_order, status, view)
      VALUES (
        ${img_url ? `'${String(img_url).replace(/'/g, "''")}'` : "''"},
        ${author || "NULL"},
        ${sort_order || "NULL"},
        ${status ?? 1},
        1
      )
    `)

    // Get inserted post ID
    const postIdResult = await prisma.$queryRawUnsafe(`
      SELECT LAST_INSERT_ID() as id
    `)
    const postId = (postIdResult as any[])[0]?.id

    if (!postId) {
      throw new Error("Failed to get post ID")
    }

    // Insert post content
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

    // Insert categories if provided
    if (category_ids && Array.isArray(category_ids) && category_ids.length > 0) {
      const values = category_ids
        .map((catId: number) => `(${postId}, ${catId})`)
        .join(", ")
      await prisma.$executeRawUnsafe(`
        INSERT INTO \`xref_post_category\` (post_id, category_id)
        VALUES ${values}
      `)
    }

    return NextResponse.json({ success: true, id: postId })
  } catch (error: any) {
    console.error("Error creating post:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

