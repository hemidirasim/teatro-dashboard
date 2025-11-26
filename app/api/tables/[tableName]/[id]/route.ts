import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ tableName: string; id: string }> }
) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { tableName, id } = await params
  const body = await request.json()

  try {
    // Get primary key column
    const primaryKeyResult = await prisma.$queryRaw<Array<{ COLUMN_NAME: string }>>`
      SELECT COLUMN_NAME
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = 'teatrd_db1' 
      AND TABLE_NAME = ${tableName}
      AND COLUMN_KEY = 'PRI'
      LIMIT 1
    `

    const primaryKey = primaryKeyResult[0]?.COLUMN_NAME || "id"
    const primaryKeyValue = body[primaryKey] || id

    const setClause = Object.entries(body)
      .filter(([key]) => key !== primaryKey)
      .map(([key, value]) => `\`${key}\` = ${typeof value === "string" ? `'${String(value).replace(/'/g, "''")}'` : value}`)
      .join(", ")

    await prisma.$executeRawUnsafe(
      `UPDATE \`${tableName}\` SET ${setClause} WHERE \`${primaryKey}\` = ${typeof primaryKeyValue === "string" ? `'${String(primaryKeyValue).replace(/'/g, "''")}'` : primaryKeyValue}`
    )
    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}



