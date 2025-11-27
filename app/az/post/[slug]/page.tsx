import { prisma } from "@/lib/prisma"
import { Header } from "@/components/frontend/header"
import { Footer } from "@/components/frontend/footer"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import Image from "next/image"
import { format } from "date-fns"
import { Calendar, Eye, ArrowLeft, User } from "lucide-react"
import { notFound } from "next/navigation"
import type { Metadata } from "next"
import { parseSlugId, getCategoryUrl, getPostUrl } from "@/lib/slug-utils"
import { normalizeImageUrl } from "@/lib/image-utils"

interface PageProps {
  params: Promise<{ slug: string }>
}

export async function generateMetadata(
  props: PageProps
): Promise<Metadata> {
  const params = await props.params
  const parsed = parseSlugId(params.slug)
  if (!parsed) {
    return { title: "Xəbər tapılmadı" }
  }

  try {
    const posts = await prisma.$queryRawUnsafe(`
      SELECT pc.title, pc.title_sub, pc.content
      FROM \`post\` p
      LEFT JOIN \`post_content\` pc ON p.id = pc.post_id AND pc.lang_id = 'az'
      WHERE p.id = ${parsed.id} AND p.status = 1
      LIMIT 1
    `) as any[]

    if (posts.length === 0) {
      return { title: "Xəbər tapılmadı" }
    }

    const post = posts[0]
    const description = post.title_sub || (post.content ? post.content.replace(/<[^>]*>/g, '').substring(0, 160) : '')

    return {
      title: post.title || "Xəbər",
      description: description,
    }
  } catch {
    return { title: "Xəbər" }
  }
}

export default async function PostDetailPage(props: PageProps) {
  const params = await props.params
  const parsed = parseSlugId(params.slug)
  
  if (!parsed) {
    notFound()
  }

  const postId = parsed.id

  let post: any = null
  let relatedPosts: any[] = []
  let author: any = null

  try {
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
      WHERE p.id = ${postId} AND p.status = 1
      LIMIT 1
    `) as any[]

    if (posts.length === 0) {
      notFound()
    }

    post = posts[0]

    // Get categories
    const categories = await prisma.$queryRawUnsafe(`
      SELECT 
        xpc.category_id,
        c.special_url,
        COALESCE(cc.title, c.special_url, CONCAT('Kateqoriya #', c.id)) as title
      FROM \`xref_post_category\` xpc
      LEFT JOIN \`category\` c ON xpc.category_id = c.id
      LEFT JOIN \`category_content\` cc ON c.id = cc.category_id AND cc.lang_id = 'az'
      WHERE xpc.post_id = ${postId}
    `) as any[]

    post.categories = categories.map((c: any) => ({
      id: c.category_id,
      title: c.title,
      slug: c.special_url
    }))

    // Get author if exists
    if (post.author) {
      const authors = await prisma.$queryRawUnsafe(`
        SELECT 
          a.id,
          a.img_url,
          COALESCE(ac.name_surname, CONCAT('Author #', a.id)) as name_surname,
          ac.post as author_post
        FROM \`author\` a
        LEFT JOIN \`author_content\` ac ON a.id = ac.author_id AND ac.lang_id = 'az'
        WHERE a.id = ${post.author} AND a.status = 1
        LIMIT 1
      `) as any[]
      if (authors.length > 0) {
        author = authors[0]
      }
    }

    // Get related posts (same categories, limit 3)
    if (post.categories.length > 0) {
      const categoryIds = post.categories.map((c: any) => c.id).join(',')
      const related = await prisma.$queryRawUnsafe(`
        SELECT 
          p.id,
          p.img_url,
          pc.title,
          pc.title_sub,
          pc.post_date
        FROM \`post\` p
        LEFT JOIN \`post_content\` pc ON p.id = pc.post_id AND pc.lang_id = 'az'
        WHERE p.id != ${postId} 
        AND p.status = 1
        AND p.id IN (
          SELECT post_id FROM \`xref_post_category\` 
          WHERE category_id IN (${categoryIds})
        )
        ORDER BY p.id DESC
        LIMIT 3
      `) as any[]
      relatedPosts = related
    }

    // Increment view count
    await prisma.$executeRawUnsafe(`
      UPDATE \`post\` SET view = view + 1 WHERE id = ${postId}
    `)
  } catch (error) {
    console.error("Error fetching post:", error)
    notFound()
  }

  const imageUrl = normalizeImageUrl(post.img_url)

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1 py-12">
        <div className="container mx-auto px-4 max-w-4xl">
          <Link href="/">
            <Button variant="ghost" className="mb-6 gap-2">
              <ArrowLeft className="h-4 w-4" />
              Geri
            </Button>
          </Link>

          <article>
            {/* Categories */}
            {post.categories && post.categories.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {post.categories.map((cat: any) => (
                  <Link
                    key={cat.id}
                    href={getCategoryUrl(cat.id, cat.slug, cat.slug)}
                  >
                    <span className="px-3 py-1 text-sm bg-primary/10 text-primary rounded-full hover:bg-primary/20 transition-colors">
                      {cat.title}
                    </span>
                  </Link>
                ))}
              </div>
            )}

            {/* Title */}
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              {post.title || 'Başlıq yoxdur'}
            </h1>

            {/* Subtitle */}
            {post.title_sub && (
              <p className="text-xl text-muted-foreground mb-6">
                {post.title_sub}
              </p>
            )}

            {/* Meta Info */}
            <div className="flex flex-wrap items-center gap-4 mb-8 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                {post.post_date 
                  ? format(new Date(post.post_date), "dd MMMM yyyy, HH:mm")
                  : '-'}
              </div>
              {post.view !== undefined && (
                <div className="flex items-center gap-2">
                  <Eye className="h-4 w-4" />
                  {post.view} baxış
                </div>
              )}
              {author && (
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  {author.name_surname}
                </div>
              )}
            </div>

            {/* Featured Image */}
            {imageUrl && (
              <div className="relative w-full h-96 mb-8 rounded-lg overflow-hidden bg-muted">
                <Image
                  src={imageUrl}
                  alt={post.title || 'Xəbər'}
                  fill
                  className="object-cover"
                  priority
                />
              </div>
            )}

            {/* Author Card */}
            {author && (
              <div className="bg-muted/50 rounded-lg p-6 mb-8 flex items-center gap-4">
                {author.img_url && (() => {
                  const authorImageUrl = normalizeImageUrl(author.img_url)
                  if (!authorImageUrl) return null
                  return (
                    <div className="relative w-20 h-20 rounded-full overflow-hidden bg-muted">
                      <Image
                        src={authorImageUrl}
                        alt={author.name_surname}
                        fill
                        className="object-cover"
                      />
                    </div>
                  )
                })()}
                <div>
                  <h3 className="font-semibold">{author.name_surname}</h3>
                  {author.author_post && (
                    <p className="text-sm text-muted-foreground">
                      {author.author_post}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Content */}
            <div 
              className="prose prose-lg dark:prose-invert max-w-none mb-12 prose-img:rounded-lg prose-img:shadow-md prose-a:text-primary prose-a:no-underline hover:prose-a:underline"
              dangerouslySetInnerHTML={{ __html: post.content || '' }}
            />

            {/* Related Posts */}
            {relatedPosts.length > 0 && (
              <div className="mt-12 pt-8 border-t">
                <h2 className="text-2xl font-bold mb-6">Oxşar Xəbərlər</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {relatedPosts.map((relatedPost) => {
                    const relatedImageUrl = normalizeImageUrl(relatedPost.img_url)
                    return (
                      <Link
                        key={relatedPost.id}
                        href={getPostUrl(relatedPost.id, null, relatedPost.title)}
                        className="group"
                      >
                        <div className="relative w-full h-48 rounded-lg overflow-hidden bg-muted mb-3">
                          {relatedImageUrl ? (
                            <Image
                              src={relatedImageUrl}
                              alt={relatedPost.title || 'Xəbər'}
                              fill
                              className="object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900 dark:to-purple-900">
                              <span className="text-2xl">📰</span>
                            </div>
                          )}
                        </div>
                        <h3 className="font-semibold group-hover:text-primary transition-colors line-clamp-2">
                          {relatedPost.title || 'Başlıq yoxdur'}
                        </h3>
                      </Link>
                    )
                  })}
                </div>
              </div>
            )}
          </article>
        </div>
      </main>

      <Footer />
    </div>
  )
}

