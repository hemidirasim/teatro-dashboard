import { prisma } from "@/lib/prisma"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Database } from "lucide-react"

export default async function TablesPage() {
  const tables = await prisma.$queryRaw<Array<{ TABLE_NAME: string }>>`
    SELECT TABLE_NAME 
    FROM INFORMATION_SCHEMA.TABLES 
    WHERE TABLE_SCHEMA = 'teatrd_db1'
    ORDER BY TABLE_NAME
  `

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Database Tables</h1>
        <p className="text-muted-foreground">Manage your database tables</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {tables.map((table) => (
          <Card key={table.TABLE_NAME}>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                <CardTitle className="text-lg">{table.TABLE_NAME}</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <Link href={`/admin/tables/${table.TABLE_NAME}`}>
                <Button variant="outline" className="w-full">
                  View & Manage
                </Button>
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}



