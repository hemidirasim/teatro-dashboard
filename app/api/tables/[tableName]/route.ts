import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ tableName: string }> }
) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { tableName } = await params
  const { searchParams } = new URL(request.url)
  const page = parseInt(searchParams.get("page") || "1")
  const pageSize = parseInt(searchParams.get("pageSize") || "20")
  const offset = (page - 1) * pageSize

  try {
    const data = await prisma.$queryRawUnsafe(
      `SELECT * FROM \`${tableName}\` LIMIT ${pageSize} OFFSET ${offset}`
    )
    return NextResponse.json({ data })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ tableName: string }> }
) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { tableName } = await params
  const body = await request.json()

  try {
    const columns = Object.keys(body).join(", ")
    const values = Object.values(body).map((v) => 
      typeof v === "string" ? `'${String(v).replace(/'/g, "''")}'` : v
    ).join(", ")

    await prisma.$executeRawUnsafe(
      `INSERT INTO \`${tableName}\` (${columns}) VALUES (${values})`
    )
    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ tableName: string }> }
) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { tableName } = await params
  const body = await request.json()

  try {
    const whereClause = Object.entries(body)
      .map(([key, value]) => `\`${key}\` = ${typeof value === "string" ? `'${String(value).replace(/'/g, "''")}'` : value}`)
      .join(" AND ")

    await prisma.$executeRawUnsafe(
      `DELETE FROM \`${tableName}\` WHERE ${whereClause}`
    )
    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}



