import { prisma } from "@/lib/prisma"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { PostForm } from "@/components/post-form"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import { notFound } from "next/navigation"

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function EditPostPage(props: PageProps) {
  const params = await props.params
  const postId = parseInt(params.id)

  // Get post data
  const posts = await prisma.$queryRawUnsafe(`
    SELECT 
      p.*,
      pc.title,
      pc.title_sub,
      pc.content,
      pc.post_date,
      pc.lang_id
    FROM \`post\` p
    LEFT JOIN \`post_content\` pc ON p.id = pc.post_id AND pc.lang_id = 'az'
    WHERE p.id = ${postId}
    LIMIT 1
  `) as any[]

  if (posts.length === 0) {
    notFound()
  }

  const post = posts[0]

  // Get post categories
  const postCategories = await prisma.$queryRawUnsafe(`
    SELECT category_id FROM \`xref_post_category\` WHERE post_id = ${postId}
  `) as any[]

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
          <h1 className="text-3xl font-bold">Xəbəri Redaktə Et</h1>
          <p className="text-muted-foreground">Xəbər məlumatlarını yeniləyin</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Xəbər Məlumatları</CardTitle>
        </CardHeader>
        <CardContent>
          <PostForm 
            initialData={{
              ...post,
              category_ids: postCategories.map((c: any) => c.category_id)
            }}
            authors={authors}
            categories={categories}
            languages={languages || [{ id: 'az', name: 'Azərbaycan' }]}
          />
        </CardContent>
      </Card>
    </div>
  )
}

