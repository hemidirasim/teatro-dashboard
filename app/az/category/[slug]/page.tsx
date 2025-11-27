import { prisma } from "@/lib/prisma"
import { Header } from "@/components/frontend/header"
import { Footer } from "@/components/frontend/footer"
import { PostCard } from "@/components/frontend/post-card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { parseSlugId } from "@/lib/slug-utils"
import { notFound } from "next/navigation"

interface PageProps {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ page?: string }>
}

export default async function CategoryPage(props: PageProps) {
  const params = await props.params
  const searchParams = await props.searchParams
  const page = parseInt(searchParams.page || "1")
  const pageSize = 12
  const offset = (page - 1) * pageSize

  // Parse slug and ID
  const parsed = parseSlugId(params.slug)
  if (!parsed) {
    notFound()
  }

  const categoryId = parsed.id

  let posts: any[] = []
  let total = 0
  let category: any = null

  try {
    // Test database connection first
    try {
      await prisma.$queryRawUnsafe('SELECT 1')
    } catch (dbError: any) {
      console.error('Database connection failed:', dbError.message)
      return (
        <div className="min-h-screen flex flex-col">
          <Header />
          <main className="flex-1 flex items-center justify-center py-20">
            <div className="text-center max-w-md mx-auto px-4">
              <h1 className="text-2xl font-bold mb-4 text-gray-900">Verilənlər bazasına qoşula bilmədi</h1>
              <p className="text-gray-600 mb-2">
                Verilənlər bazası serverinə qoşulma mümkün olmadı.
              </p>
              <p className="text-sm text-gray-500">
                Zəhmət olmasa bir az sonra yenidən cəhd edin.
              </p>
            </div>
          </main>
          <Footer />
        </div>
      )
    }

    // Get category info
    const categories = await prisma.$queryRawUnsafe(`
      SELECT 
        c.id,
        c.special_url,
        COALESCE(cc.title, c.special_url, CONCAT('Kateqoriya #', c.id)) as title
      FROM \`category\` c
      LEFT JOIN \`category_content\` cc ON c.id = cc.category_id AND cc.lang_id = 'az'
      WHERE c.id = ${categoryId} AND c.status = 1
      LIMIT 1
    `) as any[]

    if (categories.length === 0) {
      notFound()
    }

    category = categories[0]

    // Get posts
    const postsData = await prisma.$queryRawUnsafe(`
      SELECT 
        p.id,
        p.img_url,
        p.status,
        p.view,
        pc.title,
        pc.title_sub,
        pc.post_date
      FROM \`post\` p
      LEFT JOIN \`post_content\` pc ON p.id = pc.post_id AND pc.lang_id = 'az'
      WHERE p.status = 1
      AND p.id IN (
        SELECT post_id FROM \`xref_post_category\` WHERE category_id = ${categoryId}
      )
      ORDER BY p.id DESC
      LIMIT ${pageSize} OFFSET ${offset}
    `) as any[]

    // Get categories for posts
    const postIds = postsData.map((p: any) => p.id)
    let allCategories: any[] = []
    
    if (postIds.length > 0) {
      const postIdsStr = postIds.join(',')
      allCategories = await prisma.$queryRawUnsafe(`
        SELECT 
          xpc.post_id,
          xpc.category_id,
          COALESCE(cc.title, c.special_url, CONCAT('Kateqoriya #', c.id)) as title
        FROM \`xref_post_category\` xpc
        LEFT JOIN \`category\` c ON xpc.category_id = c.id
        LEFT JOIN \`category_content\` cc ON c.id = cc.category_id AND cc.lang_id = 'az'
        WHERE xpc.post_id IN (${postIdsStr})
      `) as any[]
    }

    const categoriesByPostId = allCategories.reduce((acc: any, cat: any) => {
      if (!acc[cat.post_id]) {
        acc[cat.post_id] = []
      }
      acc[cat.post_id].push({
        id: cat.category_id,
        title: cat.title,
        slug: cat.special_url || null
      })
      return acc
    }, {})

    posts = postsData.map((post: any) => ({
      ...post,
      categories: categoriesByPostId[post.id] || []
    }))

    // Get total count
    const totalResult = await prisma.$queryRawUnsafe(`
      SELECT COUNT(*) as count FROM \`post\` p
      WHERE p.status = 1
      AND p.id IN (
        SELECT post_id FROM \`xref_post_category\` WHERE category_id = ${categoryId}
      )
    `) as any[]
    total = Number(totalResult[0]?.count || 0)
  } catch (error: any) {
    console.error("Error fetching category posts:", error)
    // If it's a database connection error, show a user-friendly message
    if (error?.code === 'P1001' || error?.message?.includes("Can't reach database server")) {
      return (
        <div className="min-h-screen flex flex-col">
          <Header />
          <main className="flex-1 flex items-center justify-center py-20">
            <div className="text-center max-w-md mx-auto px-4">
              <h1 className="text-2xl font-bold mb-4 text-gray-900">Verilənlər bazasına qoşula bilmədi</h1>
              <p className="text-gray-600 mb-2">
                Verilənlər bazası serverinə qoşulma mümkün olmadı.
              </p>
              <p className="text-sm text-gray-500">
                Zəhmət olmasa bir az sonra yenidən cəhd edin.
              </p>
            </div>
          </main>
          <Footer />
        </div>
      )
    }
    notFound()
  }

  const totalPages = Math.ceil(total / pageSize)

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1 py-12">
        <div className="container mx-auto px-4">
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-2">{category.title}</h1>
            <p className="text-gray-600">
              {total} xəbər tapıldı
            </p>
          </div>

          {posts.length > 0 ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                {posts.map((post) => (
                  <PostCard key={post.id} post={post} />
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2">
                  <Link
                    href={`/az/category/${params.slug}${page > 1 ? `?page=${page - 1}` : ''}`}
                  >
                    <Button
                      variant="outline"
                      size="icon"
                      disabled={page === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                  </Link>
                  
                  <span className="text-sm text-gray-600">
                    Səhifə {page} / {totalPages}
                  </span>
                  
                  <Link
                    href={`/az/category/${params.slug}?page=${page + 1}`}
                  >
                    <Button
                      variant="outline"
                      size="icon"
                      disabled={page >= totalPages}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">
                Bu kateqoriyada xəbər tapılmadı
              </p>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  )
}

