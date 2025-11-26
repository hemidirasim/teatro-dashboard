import { prisma } from "@/lib/prisma"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import Link from "next/link"
import { AuthorActions } from "@/components/author-actions"
import { AuthorImage } from "@/components/author-image"

export default async function AuthorsPage() {
  let authors: any[] = []
  
  try {
    authors = await prisma.$queryRawUnsafe(`
      SELECT 
        a.id,
        a.img_url,
        a.count,
        a.sort_order,
        a.status,
        ac.name_surname,
        ac.post,
        ac.lang_id
      FROM \`author\` a
      LEFT JOIN \`author_content\` ac ON a.id = ac.author_id AND ac.lang_id = 'az'
      ORDER BY a.id DESC
      LIMIT 100
    `) as any[]
  } catch (error: any) {
    console.error("Error fetching authors:", error)
    authors = []
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Müəlliflər</h1>
          <p className="text-muted-foreground">Müəllifləri idarə edin</p>
        </div>
        <Link href="/admin/authors/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Yeni Müəllif
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Bütün Müəlliflər</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Şəkil</TableHead>
                  <TableHead>Ad Soyad</TableHead>
                  <TableHead>Vəzifə</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Xəbər Sayı</TableHead>
                  <TableHead>Əməliyyatlar</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {authors.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center">
                      Müəllif tapılmadı
                    </TableCell>
                  </TableRow>
                ) : (
                  authors.map((author) => (
                    <TableRow key={author.id}>
                      <TableCell>{author.id}</TableCell>
                      <TableCell>
                        <AuthorImage 
                          src={author.img_url || ''} 
                          alt={author.name_surname || ''} 
                          className="w-16 h-16 object-cover rounded"
                        />
                      </TableCell>
                      <TableCell>{author.name_surname || '-'}</TableCell>
                      <TableCell>{author.post || '-'}</TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded text-xs ${
                          author.status === 1 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {author.status === 1 ? 'Aktiv' : 'Qeyri-aktiv'}
                        </span>
                      </TableCell>
                      <TableCell>{author.count || 0}</TableCell>
                      <TableCell>
                        <AuthorActions authorId={author.id} />
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

