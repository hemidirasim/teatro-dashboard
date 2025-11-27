import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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
      WHERE p.id = ${postId} AND p.status = 1
      LIMIT 1
    `) as any[]

    if (posts.length === 0) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 })
    }

    const post = posts[0]

    // Get categories
    const categories = await prisma.$queryRawUnsafe(`
      SELECT 
        xpc.category_id,
        COALESCE(cc.title, c.special_url, CONCAT('Kateqoriya #', c.id)) as title
      FROM \`xref_post_category\` xpc
      LEFT JOIN \`category\` c ON xpc.category_id = c.id
      LEFT JOIN \`category_content\` cc ON c.id = cc.category_id AND cc.lang_id = 'az'
      WHERE xpc.post_id = ${postId}
    `) as any[]

    // Get author if exists
    let author = null
    if (post.author) {
      const authors = await prisma.$queryRawUnsafe(`
        SELECT 
          a.id,
          a.img_url,
          COALESCE(ac.name_surname, CONCAT('Author #', a.id)) as name_surname,
          ac.post as author_post
        FROM \`author\` a
        LEFT JOIN \`author_content\` ac ON a.id = ac.author_id AND ac.lang_id = 'az'
        WHERE a.id = ${post.author}
        LIMIT 1
      `) as any[]
      if (authors.length > 0) {
        author = authors[0]
      }
    }

    // Increment view count
    await prisma.$executeRawUnsafe(`
      UPDATE \`post\` SET view = view + 1 WHERE id = ${postId}
    `)

    return NextResponse.json({
      ...post,
      categories: categories.map((c: any) => ({
        id: c.category_id,
        title: c.title
      })),
      author
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

