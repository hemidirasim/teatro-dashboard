import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  try {
    const categories = await prisma.$queryRawUnsafe(`
      SELECT 
        c.id,
        c.special_url,
        c.parent_id,
        c.status,
        COALESCE(cc.title, c.special_url, CONCAT('Kateqoriya #', c.id)) as title
      FROM \`category\` c
      LEFT JOIN \`category_content\` cc ON c.id = cc.category_id AND cc.lang_id = 'az'
      WHERE c.status = 1
      ORDER BY c.sort_order, c.id
    `) as any[]

    return NextResponse.json({ data: categories })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

