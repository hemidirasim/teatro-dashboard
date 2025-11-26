import { prisma } from "@/lib/prisma"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AuthorForm } from "@/components/author-form"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"

export default async function NewAuthorPage() {
  // Get languages
  const languages = await prisma.$queryRawUnsafe(`
    SELECT code as id, name FROM \`language\` ORDER BY id
  `) as any[]

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/authors">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Yeni Müəllif</h1>
          <p className="text-muted-foreground">Yeni müəllif əlavə edin</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Müəllif Məlumatları</CardTitle>
        </CardHeader>
        <CardContent>
          <AuthorForm 
            languages={languages || [{ id: 'az', name: 'Azərbaycan' }]}
          />
        </CardContent>
      </Card>
    </div>
  )
}

