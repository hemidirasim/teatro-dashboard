import { prisma } from "@/lib/prisma"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AuthorForm } from "@/components/author-form"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import { notFound } from "next/navigation"

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function EditAuthorPage(props: PageProps) {
  const params = await props.params
  const authorId = parseInt(params.id)

  // Get author data
  const authors = await prisma.$queryRawUnsafe(`
    SELECT 
      a.*,
      ac.name_surname,
      ac.post,
      ac.lang_id
    FROM \`author\` a
    LEFT JOIN \`author_content\` ac ON a.id = ac.author_id AND ac.lang_id = 'az'
    WHERE a.id = ${authorId}
    LIMIT 1
  `) as any[]

  if (authors.length === 0) {
    notFound()
  }

  const author = authors[0]

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
          <h1 className="text-3xl font-bold">Müəllifi Redaktə Et</h1>
          <p className="text-muted-foreground">Müəllif məlumatlarını yeniləyin</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Müəllif Məlumatları</CardTitle>
        </CardHeader>
        <CardContent>
          <AuthorForm 
            initialData={author}
            languages={languages || [{ id: 'az', name: 'Azərbaycan' }]}
          />
        </CardContent>
      </Card>
    </div>
  )
}

