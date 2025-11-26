import { prisma } from "@/lib/prisma"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { TableForm } from "@/components/table-form"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"

interface PageProps {
  params: Promise<{ tableName: string }>
}

export default async function NewRecordPage(props: PageProps) {
  const params = await props.params
  const tableName = params.tableName

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

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href={`/admin/tables/${tableName}`}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">New Record</h1>
          <p className="text-muted-foreground">Add a new record to {tableName}</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Create New Record</CardTitle>
        </CardHeader>
        <CardContent>
          <TableForm tableName={tableName} columns={columns} />
        </CardContent>
      </Card>
    </div>
  )
}



