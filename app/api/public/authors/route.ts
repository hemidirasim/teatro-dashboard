import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  try {
    const authors = await prisma.$queryRawUnsafe(`
      SELECT 
        a.id,
        a.img_url,
        a.count,
        a.status,
        COALESCE(ac.name_surname, CONCAT('Author #', a.id)) as name_surname,
        ac.post as author_post
      FROM \`author\` a
      LEFT JOIN \`author_content\` ac ON a.id = ac.author_id AND ac.lang_id = 'az'
      WHERE a.status = 1
      ORDER BY a.sort_order, a.id DESC
    `) as any[]

    return NextResponse.json({ data: authors })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

