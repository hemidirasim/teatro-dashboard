import { prisma } from "@/lib/prisma"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { TableForm } from "@/components/table-form"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"

interface PageProps {
  params: Promise<{ tableName: string; id: string }>
}

export default async function EditRecordPage(props: PageProps) {
  const params = await props.params
  const { tableName, id } = params

  const columns = await prisma.$queryRaw<Array<{
    COLUMN_NAME: string
    DATA_TYPE: string
    IS_NULLABLE: string
    COLUMN_KEY: string
    COLUMN_DEFAULT: string | null
  }>>`
    SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_KEY, COLUMN_DEFAULT
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = 'teatrd_db1' AND TABLE_NAME = ${tableName}
    ORDER BY ORDINAL_POSITION
  `

  const primaryKey = columns.find((c) => c.COLUMN_KEY === "PRI")?.COLUMN_NAME || "id"

  let record: any = null
  try {
    const result = await prisma.$queryRawUnsafe(
      `SELECT * FROM \`${tableName}\` WHERE \`${primaryKey}\` = ${isNaN(Number(id)) ? `'${id.replace(/'/g, "''")}'` : id} LIMIT 1`
    )
    record = (result as any[])[0] || null
  } catch (error) {
    console.error("Error fetching record:", error)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href={`/admin/tables/${tableName}`}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Edit Record</h1>
          <p className="text-muted-foreground">Edit record in {tableName}</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Edit Record</CardTitle>
        </CardHeader>
        <CardContent>
          {record ? (
            <TableForm tableName={tableName} columns={columns} initialData={record} />
          ) : (
            <p>Record not found</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}



