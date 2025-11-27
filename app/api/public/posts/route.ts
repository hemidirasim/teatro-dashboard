import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const page = parseInt(searchParams.get("page") || "1")
  const pageSize = parseInt(searchParams.get("pageSize") || "12")
  const categoryId = searchParams.get("category")
  const offset = (page - 1) * pageSize

  try {
    let postsQuery = `
      SELECT 
        p.id,
        p.img_url,
        p.author,
        p.status,
        p.view,
        pc.title,
        pc.title_sub,
        pc.post_date,
        pc.lang_id
      FROM \`post\` p
      LEFT JOIN \`post_content\` pc ON p.id = pc.post_id AND pc.lang_id = 'az'
      WHERE p.status = 1
    `

    if (categoryId) {
      postsQuery += ` AND p.id IN (
        SELECT post_id FROM \`xref_post_category\` WHERE category_id = ${parseInt(categoryId)}
      )`
    }

    postsQuery += ` ORDER BY p.id DESC LIMIT ${pageSize} OFFSET ${offset}`

    const posts = await prisma.$queryRawUnsafe(postsQuery) as any[]

    // Get all categories for all posts
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

    // Get total count
    let countQuery = `SELECT COUNT(*) as count FROM \`post\` p WHERE p.status = 1`
    if (categoryId) {
      countQuery += ` AND p.id IN (
        SELECT post_id FROM \`xref_post_category\` WHERE category_id = ${parseInt(categoryId)}
      )`
    }
    const total = await prisma.$queryRawUnsafe(countQuery)

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

