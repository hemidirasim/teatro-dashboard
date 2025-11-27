import { prisma } from "@/lib/prisma"
import { Header } from "@/components/frontend/header"
import { Footer } from "@/components/frontend/footer"
import { PostCard } from "@/components/frontend/post-card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { getCategoryUrl } from "@/lib/slug-utils"
import { redirect } from "next/navigation"

interface PageProps {
  searchParams: Promise<{ page?: string; category?: string }>
}

export default async function PostsPage(props: PageProps) {
  const searchParams = await props.searchParams
  const categoryId = searchParams.category

  // If category is provided, redirect to new URL format
  if (categoryId) {
    try {
      const category = await prisma.$queryRawUnsafe(`
        SELECT id, special_url FROM \`category\` WHERE id = ${parseInt(categoryId)} AND status = 1 LIMIT 1
      `) as any[]
      if (category.length > 0) {
        const categorySlug = category[0].special_url || `category-${category[0].id}`
        redirect(`/az/category/${categorySlug}-${category[0].id}`)
      }
    } catch (error) {
      console.error("Error redirecting category:", error)
    }
  }

  // Redirect to home page if no category
  redirect("/")
    // Get posts
    let postsQuery = `
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
    `

    if (categoryId) {
      postsQuery += ` AND p.id IN (
        SELECT post_id FROM \`xref_post_category\` WHERE category_id = ${parseInt(categoryId)}
      )`
    }

    postsQuery += ` ORDER BY p.id DESC LIMIT ${pageSize} OFFSET ${offset}`

    const postsData = await prisma.$queryRawUnsafe(postsQuery) as any[]

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
        title: cat.title
      })
      return acc
    }, {})

    posts = postsData.map((post: any) => ({
      ...post,
      categories: categoriesByPostId[post.id] || []
    }))

    // Get total count
    let countQuery = `SELECT COUNT(*) as count FROM \`post\` p WHERE p.status = 1`
    if (categoryId) {
      countQuery += ` AND p.id IN (
        SELECT post_id FROM \`xref_post_category\` WHERE category_id = ${parseInt(categoryId)}
      )`
    }
    const totalResult = await prisma.$queryRawUnsafe(countQuery) as any[]
    total = Number(totalResult[0]?.count || 0)

    // Get all categories for sidebar
    categories = await prisma.$queryRawUnsafe(`
      SELECT 
        c.id,
        c.special_url,
        COALESCE(cc.title, c.special_url, CONCAT('Kateqoriya #', c.id)) as title,
        (SELECT COUNT(*) FROM \`xref_post_category\` xpc WHERE xpc.category_id = c.id) as post_count
      FROM \`category\` c
      LEFT JOIN \`category_content\` cc ON c.id = cc.category_id AND cc.lang_id = 'az'
      WHERE c.status = 1
      ORDER BY c.sort_order
    `) as any[]

    // Get selected category info
    if (categoryId) {
      const catResult = await prisma.$queryRawUnsafe(`
        SELECT 
          c.id,
          COALESCE(cc.title, c.special_url, CONCAT('Kateqoriya #', c.id)) as title
        FROM \`category\` c
        LEFT JOIN \`category_content\` cc ON c.id = cc.category_id AND cc.lang_id = 'az'
        WHERE c.id = ${parseInt(categoryId)} AND c.status = 1
        LIMIT 1
      `) as any[]
      if (catResult.length > 0) {
        selectedCategory = catResult[0]
      }
    }
  } catch (error) {
    console.error("Error fetching posts:", error)
  }

  const totalPages = Math.ceil(total / pageSize)

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1 py-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Main Content */}
            <div className="flex-1">
              {selectedCategory && (
                <div className="mb-6">
                  <h1 className="text-3xl font-bold mb-2">
                    {selectedCategory.title}
                  </h1>
                  <p className="text-muted-foreground">
                    {total} xəbər tapıldı
                  </p>
                </div>
              )}
              
              {!selectedCategory && (
                <div className="mb-6">
                  <h1 className="text-3xl font-bold mb-2">Bütün Xəbərlər</h1>
                  <p className="text-muted-foreground">
                    Mədəniyyət, sənət və tədbirlər haqqında xəbərlər
                  </p>
                </div>
              )}

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
                        href={`/xeberler?page=${page - 1}${categoryId ? `&category=${categoryId}` : ''}`}
                      >
                        <Button
                          variant="outline"
                          size="icon"
                          disabled={page === 1}
                        >
                          <ChevronLeft className="h-4 w-4" />
                        </Button>
                      </Link>
                      
                      <span className="text-sm text-muted-foreground">
                        Səhifə {page} / {totalPages}
                      </span>
                      
                      <Link
                        href={`/xeberler?page=${page + 1}${categoryId ? `&category=${categoryId}` : ''}`}
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
                  <p className="text-muted-foreground text-lg">
                    Xəbər tapılmadı
                  </p>
                </div>
              )}
            </div>

            {/* Sidebar */}
            <aside className="lg:w-64">
              <div className="sticky top-20">
                <div className="bg-card rounded-lg border p-6">
                  <h3 className="font-semibold mb-4">Kateqoriyalar</h3>
                  <ul className="space-y-2">
                    <li>
                      <Link
                        href="/xeberler"
                        className={`block py-2 px-3 rounded hover:bg-muted transition-colors ${
                          !categoryId ? 'bg-primary/10 text-primary font-medium' : ''
                        }`}
                      >
                        Hamısı
                      </Link>
                    </li>
                    {categories.map((cat) => (
                      <li key={cat.id}>
                        <Link
                          href={`/xeberler?category=${cat.id}`}
                          className={`block py-2 px-3 rounded hover:bg-muted transition-colors ${
                            categoryId === cat.id.toString() ? 'bg-primary/10 text-primary font-medium' : ''
                          }`}
                        >
                          {cat.title}
                          {cat.post_count > 0 && (
                            <span className="ml-2 text-xs text-muted-foreground">
                              ({cat.post_count})
                            </span>
                          )}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}

