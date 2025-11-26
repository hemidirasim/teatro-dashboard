import { prisma } from "@/lib/prisma"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { PostForm } from "@/components/post-form"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"

export default async function NewPostPage() {
  // Get authors
  const authors = await prisma.$queryRawUnsafe(`
    SELECT 
      a.id,
      COALESCE(ac.name_surname, CONCAT('Author #', a.id)) as name
    FROM \`author\` a
    LEFT JOIN \`author_content\` ac ON a.id = ac.author_id AND ac.lang_id = 'az'
    ORDER BY a.id
  `) as any[]

  // Get categories
  const categories = await prisma.$queryRawUnsafe(`
    SELECT 
      c.id,
      c.special_url,
      c.parent_id,
      COALESCE(cc.title, c.special_url, CONCAT('Kateqoriya #', c.id)) as title
    FROM \`category\` c
    LEFT JOIN \`category_content\` cc ON c.id = cc.category_id AND cc.lang_id = 'az'
    WHERE c.status = 1
    ORDER BY c.sort_order
  `) as any[]

  // Get languages
  const languages = await prisma.$queryRawUnsafe(`
    SELECT code as id, name FROM \`language\` ORDER BY id
  `) as any[]

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/posts">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Yeni Xəbər</h1>
          <p className="text-muted-foreground">Yeni xəbər əlavə edin</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Xəbər Məlumatları</CardTitle>
        </CardHeader>
        <CardContent>
          <PostForm 
            authors={authors}
            categories={categories}
            languages={languages || [{ id: 'az', name: 'Azərbaycan' }]}
          />
        </CardContent>
      </Card>
    </div>
  )
}

