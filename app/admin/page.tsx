import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Settings, Newspaper, UserPen, Users } from "lucide-react"

export default async function AdminDashboard() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">Teatro Admin Paneline xoş gəlmisiniz</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Newspaper className="h-5 w-5" />
              Xəbərlər
            </CardTitle>
            <CardDescription>Xəbərləri idarə edin</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/admin/posts">
              <Button variant="outline" className="w-full">
                Xəbərlərə Get
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserPen className="h-5 w-5" />
              Müəlliflər
            </CardTitle>
            <CardDescription>Müəllifləri idarə edin</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/admin/authors">
              <Button variant="outline" className="w-full">
                Müəlliflərə Get
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              İstifadəçilər
            </CardTitle>
            <CardDescription>İstifadəçiləri idarə edin</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/admin/users">
              <Button variant="outline" className="w-full">
                İstifadəçilərə Get
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Parametrlər
            </CardTitle>
            <CardDescription>Əlaqə və haqqımızda məlumatlarını redaktə edin</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/admin/settings">
              <Button variant="outline" className="w-full">
                Parametrlərə Get
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}



