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
    `) as any[]

    // Get all categories for all posts in one query
    const postIds = posts.map((p: any) => p.id)
    let allCategories: any[] = []
    
    if (postIds.length > 0) {
      const postIdsStr = postIds.join(',')
      allCategories = await prisma.$queryRawUnsafe(`
        SELECT 
          xpc.post_id,
          xpc.category_id,
          COALESCE(cc.title, c.special_url, CONCAT('Kateqoriya #', c.id)) as title
        FROM \`xref_post_category\` xpc
        LEFT JOIN \`category\` c ON xpc.category_id = c.id
        LEFT JOIN \`category_content\` cc ON c.id = cc.category_id AND cc.lang_id = 'az'
        WHERE xpc.post_id IN (${postIdsStr})
      `) as any[]
    }

    // Group categories by post_id
    const categoriesByPostId = allCategories.reduce((acc: any, cat: any) => {
      if (!acc[cat.post_id]) {
        acc[cat.post_id] = []
      }
      acc[cat.post_id].push({
        id: cat.category_id,
        title: cat.title
      })
      return acc
    }, {})

    // Add categories to posts
    const postsWithCategories = posts.map((post: any) => ({
      ...post,
      categories: categoriesByPostId[post.id] || []
    }))

    const total = await prisma.$queryRawUnsafe(`
      SELECT COUNT(*) as count FROM \`post\`
    `)

    return NextResponse.json({
      data: postsWithCategories,
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

    // Insert post
    const imgUrlValue = img_url ? escape(img_url) : "''"
    const authorValue = author ? author : "NULL"
    const sortOrderValue = sort_order ? sort_order : "NULL"
    const statusValue = status ?? 1

    await prisma.$executeRawUnsafe(`
      INSERT INTO \`post\` (img_url, author, sort_order, status, view)
      VALUES (${imgUrlValue}, ${authorValue}, ${sortOrderValue}, ${statusValue}, 1)
    `)

    // Get inserted post ID
    const postIdResult = await prisma.$queryRawUnsafe<Array<{ id: bigint }>>(
      `SELECT LAST_INSERT_ID() as id`
    )
    const postId = Number(postIdResult[0]?.id)

    if (!postId) {
      throw new Error("Failed to get post ID")
    }

    // Insert post content
    const titleValue = title ? escape(title) : "''"
    const titleSubValue = title_sub ? escape(title_sub) : "NULL"
    const contentValue = content ? escape(content) : "''"
    const postDateValue = post_date ? escape(post_date) : "NULL"
    const langIdValue = lang_id ? escape(lang_id) : "'az'"

    await prisma.$executeRawUnsafe(`
      INSERT INTO \`post_content\` (title, title_sub, content, post_id, post_date, lang_id)
      VALUES (${titleValue}, ${titleSubValue}, ${contentValue}, ${postId}, ${postDateValue}, ${langIdValue})
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
    return NextResponse.json({ 
      error: error.message || "Xəta baş verdi",
      details: process.env.NODE_ENV === "development" ? error.stack : undefined
    }, { status: 500 })
  }
}

