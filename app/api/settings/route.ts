import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"

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
  try {
    // Check if settings table exists and has value column
    const tables = await prisma.$queryRawUnsafe(`
      SHOW TABLES LIKE 'settings'
    `) as any[]

    if (tables.length > 0) {
      // Check if value column exists
      const columns = await prisma.$queryRawUnsafe(`
        SHOW COLUMNS FROM \`settings\` LIKE 'value'
      `) as any[]

      if (columns.length === 0) {
        // Add value column to existing table
        await prisma.$executeRawUnsafe(`
          ALTER TABLE \`settings\` ADD COLUMN \`value\` TEXT AFTER \`settings_key\`
        `)
      }
    } else {
      // Create settings table
      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS \`settings\` (
          \`settings_id\` INT AUTO_INCREMENT PRIMARY KEY,
          \`settings_key\` VARCHAR(255) UNIQUE NOT NULL,
          \`value\` TEXT,
          \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          \`updated_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `)

      // Insert default values
      await prisma.$executeRawUnsafe(`
        INSERT INTO \`settings\` (\`settings_key\`, \`value\`) VALUES
        ('about_text', 'Mədəniyyət portalı - ən son xəbərlər, məqalələr və mədəni tədbirlər haqqında məlumat.'),
        ('email', 'info@teatro.az'),
        ('phone', '+994 12 123 45 67'),
        ('address', ''),
        ('copyright', 'Teatro')
      `)
    }

    // Get all settings
    const settings = await prisma.$queryRawUnsafe(`
      SELECT \`settings_key\` as \`key\`, \`value\` FROM \`settings\`
    `) as any[]

    const settingsObj = settings.reduce((acc: any, setting: any) => {
      acc[setting.key] = setting.value
      return acc
    }, {})

    return NextResponse.json(settingsObj)
  } catch (error: any) {
    console.error("Error fetching settings:", error)
    return NextResponse.json({ 
      error: error.message || "Xəta baş verdi",
      details: process.env.NODE_ENV === "development" ? error.stack : undefined
    }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { about_text, email, phone, address, copyright } = body

    // Update or insert settings
    const settings = [
      { key: 'about_text', value: about_text || '' },
      { key: 'email', value: email || '' },
      { key: 'phone', value: phone || '' },
      { key: 'address', value: address || '' },
      { key: 'copyright', value: copyright || 'Teatro' },
    ]

    for (const setting of settings) {
      await prisma.$executeRawUnsafe(`
        INSERT INTO \`settings\` (\`settings_key\`, \`value\`)
        VALUES (${escape(setting.key)}, ${escape(setting.value)})
        ON DUPLICATE KEY UPDATE \`value\` = ${escape(setting.value)}
      `)
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Error updating settings:", error)
    return NextResponse.json({ 
      error: error.message || "Xəta baş verdi",
      details: process.env.NODE_ENV === "development" ? error.stack : undefined
    }, { status: 500 })
  }
}

