import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

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

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const query = searchParams.get("q") || ""
  const limit = parseInt(searchParams.get("limit") || "10")

  if (!query || query.trim().length === 0) {
    return NextResponse.json({ data: [], total: 0 })
  }

  if (query.trim().length < 2) {
    return NextResponse.json({ data: [], total: 0 })
  }

  try {
    // Test database connection first
    try {
      await prisma.$queryRawUnsafe('SELECT 1')
    } catch (dbError: any) {
      console.error('Database connection failed in search:', dbError.message)
      return NextResponse.json({ 
        error: "Database connection failed",
        data: [],
        total: 0
      }, { status: 500 })
    }

    const searchTerm = escape(`%${query.trim()}%`)

    // Search in posts (title, title_sub, content)
    const posts = await prisma.$queryRawUnsafe(`
      SELECT 
        p.id,
        p.img_url,
        p.status,
        p.view,
        pc.title,
        pc.title_sub,
        pc.post_date,
        pc.lang_id
      FROM \`post\` p
      LEFT JOIN \`post_content\` pc ON p.id = pc.post_id AND pc.lang_id = 'az'
      WHERE p.status = 1
      AND (
        pc.title LIKE ${searchTerm}
        OR pc.title_sub LIKE ${searchTerm}
        OR pc.content LIKE ${searchTerm}
      )
      ORDER BY p.id DESC
      LIMIT ${limit}
    `) as any[]

    // Get categories for found posts
    const postIds = posts.map((p: any) => p.id)
    let allCategories: any[] = []
    
    if (postIds.length > 0) {
      const postIdsStr = postIds.join(',')
      allCategories = await prisma.$queryRawUnsafe(`
        SELECT 
          xpc.post_id,
          xpc.category_id,
          c.special_url,
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
        title: cat.title,
        slug: cat.special_url || null
      })
      return acc
    }, {})

    // Add categories to posts
    const postsWithCategories = posts.map((post: any) => ({
      ...post,
      categories: categoriesByPostId[post.id] || []
    }))

    return NextResponse.json({
      data: postsWithCategories,
      total: postsWithCategories.length,
    })
  } catch (error: any) {
    console.error("Error searching posts:", error)
    
    // Check if it's a database connection error
    if (error?.code === 'P1001' || error?.message?.includes("Can't reach database server")) {
      return NextResponse.json({ 
        error: "Database connection failed",
        data: [],
        total: 0
      }, { status: 500 })
    }
    
    return NextResponse.json({ 
      error: error.message || "Xəta baş verdi",
      data: [],
      total: 0,
      details: process.env.NODE_ENV === "development" ? error.stack : undefined
    }, { status: 500 })
  }
}

