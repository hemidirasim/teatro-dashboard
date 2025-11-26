import { prisma } from "@/lib/prisma"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Plus, Edit, Trash2, Eye } from "lucide-react"
import Link from "next/link"
import { format } from "date-fns"
import { PostActions } from "@/components/post-actions"
import { PostImage } from "@/components/post-image"

export default async function PostsPage() {
  let posts: any[] = []
  
  try {
    posts = await prisma.$queryRawUnsafe(`
      SELECT 
        p.id,
        p.img_url,
        p.author,
        p.sort_order,
        p.status,
        p.view,
        pc.title,
        pc.post_date,
        pc.lang_id
      FROM \`post\` p
      LEFT JOIN \`post_content\` pc ON p.id = pc.post_id AND pc.lang_id = 'az'
      ORDER BY p.id DESC
      LIMIT 50
    `) as any[]
  } catch (error: any) {
    console.error("Error fetching posts:", error)
    // Return empty array on error
    posts = []
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Xəbərlər</h1>
          <p className="text-muted-foreground">Xəbərləri idarə edin</p>
        </div>
        <Link href="/admin/posts/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Yeni Xəbər
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Bütün Xəbərlər</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Şəkil</TableHead>
                  <TableHead>Başlıq</TableHead>
                  <TableHead>Tarix</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Baxış</TableHead>
                  <TableHead>Əməliyyatlar</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {posts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center">
                      Xəbər tapılmadı
                    </TableCell>
                  </TableRow>
                ) : (
                  posts.map((post) => (
                    <TableRow key={post.id}>
                      <TableCell>{post.id}</TableCell>
                      <TableCell>
                        <PostImage 
                          src={post.img_url || ''} 
                          alt={post.title || 'Xəbər şəkli'} 
                          className="w-20 h-20 object-cover rounded border"
                        />
                      </TableCell>
                      <TableCell className="max-w-xs truncate">
                        {post.title || 'Başlıq yoxdur'}
                      </TableCell>
                      <TableCell>
                        {post.post_date 
                          ? format(new Date(post.post_date), "dd.MM.yyyy HH:mm")
                          : '-'}
                      </TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded text-xs ${
                          post.status === 1 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {post.status === 1 ? 'Aktiv' : 'Qeyri-aktiv'}
                        </span>
                      </TableCell>
                      <TableCell>{post.view || 0}</TableCell>
                      <TableCell>
                        <PostActions postId={post.id} />
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

