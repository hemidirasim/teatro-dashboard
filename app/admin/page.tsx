import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { prisma } from "@/lib/prisma"

export default async function AdminDashboard() {
  // Get table count from information_schema
  const tables = await prisma.$queryRaw<Array<{ TABLE_NAME: string }>>`
    SELECT TABLE_NAME 
    FROM INFORMATION_SCHEMA.TABLES 
    WHERE TABLE_SCHEMA = 'teatrd_db1'
  `

  const tableCount = tables.length

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">Welcome to Teatro Admin Panel</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Database Tables</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{tableCount}</div>
            <p className="text-xs text-muted-foreground">Total tables in database</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Database Connection</CardTitle>
          <CardDescription>Connected to remote MySQL database</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <p className="text-sm">
              <span className="font-medium">Host:</span> 68.183.173.136
            </p>
            <p className="text-sm">
              <span className="font-medium">Database:</span> teatrd_db1
            </p>
            <p className="text-sm">
              <span className="font-medium">Status:</span>{" "}
              <span className="text-green-600">Connected</span>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}



