import { prisma } from "@/lib/prisma"
import { Header } from "@/components/frontend/header"
import { Footer } from "@/components/frontend/footer"
import { Card, CardContent } from "@/components/ui/card"
import Link from "next/link"
import Image from "next/image"
import { User } from "lucide-react"
import { normalizeImageUrl } from "@/lib/image-utils"

export default async function AuthorsPage() {
  let authors: any[] = []

  try {
    authors = await prisma.$queryRawUnsafe(`
      SELECT 
        a.id,
        a.img_url,
        a.count,
        COALESCE(ac.name_surname, CONCAT('Author #', a.id)) as name_surname,
        ac.post as author_post
      FROM \`author\` a
      LEFT JOIN \`author_content\` ac ON a.id = ac.author_id AND ac.lang_id = 'az'
      WHERE a.status = 1
      ORDER BY a.sort_order, a.id DESC
    `) as any[]
  } catch (error) {
    console.error("Error fetching authors:", error)
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1 py-12">
        <div className="container mx-auto px-4">
          <div className="mb-12 text-center">
            <h1 className="text-4xl font-bold mb-4">Müəlliflər</h1>
            <p className="text-muted-foreground text-lg">
              Portalımızın müəllifləri ilə tanış olun
            </p>
          </div>

          {authors.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {authors.map((author) => {
                const imageUrl = normalizeImageUrl(author.img_url)
                
                return (
                  <Card key={author.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                    <CardContent className="p-0">
                      <div className="relative w-full h-64 bg-muted">
                        {imageUrl ? (
                          <Image
                            src={imageUrl}
                            alt={author.name_surname}
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <div className="flex items-center justify-center h-full">
                            <User className="h-24 w-24 text-muted-foreground" />
                          </div>
                        )}
                      </div>
                      <div className="p-6">
                        <h3 className="text-xl font-semibold mb-2">
                          {author.name_surname}
                        </h3>
                        {author.author_post && (
                          <p className="text-sm text-muted-foreground mb-4">
                            {author.author_post}
                          </p>
                        )}
                        {author.count !== undefined && (
                          <p className="text-xs text-muted-foreground">
                            {author.count} məqalə
                          </p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground text-lg">
                Müəllif tapılmadı
              </p>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  )
}

