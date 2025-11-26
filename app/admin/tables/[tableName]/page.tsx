import { prisma } from "@/lib/prisma"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import Link from "next/link"
import { TableActions } from "@/components/table-actions"

interface PageProps {
  params: Promise<{ tableName: string }>
  searchParams: Promise<{ page?: string }>
}

export default async function TablePage(props: PageProps) {
  const params = await props.params
  const searchParams = await props.searchParams
  const tableName = params.tableName
  const page = parseInt(searchParams.page || "1")
  const pageSize = 20
  const offset = (page - 1) * pageSize

  // Get table columns
  const columns = await prisma.$queryRaw<Array<{
    COLUMN_NAME: string
    DATA_TYPE: string
    IS_NULLABLE: string
    COLUMN_KEY: string
  }>>`
    SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_KEY
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = 'teatrd_db1' AND TABLE_NAME = ${tableName}
    ORDER BY ORDINAL_POSITION
  `

  // Get table data (limited for safety)
  let data: any[] = []
  let totalCount = 0

  try {
    // Get total count
    const countResult = await prisma.$queryRaw<Array<{ count: bigint }>>`
      SELECT COUNT(*) as count FROM \`${tableName}\`
    `
    totalCount = Number(countResult[0]?.count || 0)

    // Get paginated data
    const dataResult = await prisma.$queryRawUnsafe(
      `SELECT * FROM \`${tableName}\` LIMIT ${pageSize} OFFSET ${offset}`
    )
    data = dataResult as any[]
  } catch (error) {
    console.error("Error fetching table data:", error)
  }

  const totalPages = Math.ceil(totalCount / pageSize)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold capitalize">{tableName}</h1>
          <p className="text-muted-foreground">
            {totalCount} total records
          </p>
        </div>
        <Link href={`/admin/tables/${tableName}/new`}>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add New
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Table Data</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  {columns.map((col) => (
                    <TableHead key={col.COLUMN_NAME}>
                      {col.COLUMN_NAME}
                      {col.COLUMN_KEY === "PRI" && (
                        <span className="ml-1 text-xs text-muted-foreground">(PK)</span>
                      )}
                    </TableHead>
                  ))}
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={columns.length + 1} className="text-center">
                      No data found
                    </TableCell>
                  </TableRow>
                ) : (
                  data.map((row, idx) => {
                    const primaryKey = columns.find((c) => c.COLUMN_KEY === "PRI")?.COLUMN_NAME
                    const primaryKeyValue = primaryKey ? row[primaryKey] : idx
                    return (
                      <TableRow key={idx}>
                        {columns.map((col) => (
                          <TableCell key={col.COLUMN_NAME}>
                            {row[col.COLUMN_NAME] !== null && row[col.COLUMN_NAME] !== undefined
                              ? String(row[col.COLUMN_NAME])
                              : <span className="text-muted-foreground">null</span>}
                          </TableCell>
                        ))}
                        <TableCell>
                          <TableActions
                            tableName={tableName}
                            primaryKey={primaryKey || "id"}
                            primaryKeyValue={primaryKeyValue}
                          />
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </div>

          {totalPages > 1 && (
            <div className="mt-4 flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Page {page} of {totalPages}
              </p>
              <div className="flex gap-2">
                {page > 1 && (
                  <Link href={`/admin/tables/${tableName}?page=${page - 1}`}>
                    <Button variant="outline">Previous</Button>
                  </Link>
                )}
                {page < totalPages && (
                  <Link href={`/admin/tables/${tableName}?page=${page + 1}`}>
                    <Button variant="outline">Next</Button>
                  </Link>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}



