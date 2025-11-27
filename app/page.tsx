import { prisma } from "@/lib/prisma"
import { Header } from "@/components/frontend/header"
import { Footer } from "@/components/frontend/footer"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import Image from "next/image"
import { format } from "date-fns"
import { Calendar, Eye, Mail, ArrowRight } from "lucide-react"
import { normalizeImageUrl } from "@/lib/image-utils"
import { getPostUrl, getCategoryUrl, generateSlug } from "@/lib/slug-utils"
import { HeroSlider } from "@/components/frontend/hero-slider"

export default async function HomePage() {
  // Get hero slider posts (latest 5)
  let heroPosts: any[] = []
  let sidebarPosts: any[] = []
  let editorPicks: any[] = []
  let latestNews: any[] = []
  let categorySections: Record<string, any[]> = {}
  let trendingPosts: any[] = []
  let categories: any[] = []
  
  try {
    // Test database connection first with retry logic
    let dbConnected = false
    try {
      // Try to reconnect if connection is closed
      try {
        await prisma.$connect()
      } catch (connectError: any) {
        // Connection might already be open, ignore
        if (!connectError.message?.includes('already connected')) {
          console.warn('Connection attempt:', connectError.message)
        }
      }
      
      await prisma.$queryRawUnsafe('SELECT 1')
      dbConnected = true
    } catch (dbError: any) {
      console.error('Database connection failed:', dbError.message)
      
      // Try to reconnect once
      if (dbError.message?.includes('closed') || dbError.code === 'P1001') {
        try {
          await prisma.$disconnect()
          await new Promise(resolve => setTimeout(resolve, 1000))
          await prisma.$connect()
          await prisma.$queryRawUnsafe('SELECT 1')
          dbConnected = true
        } catch (retryError: any) {
          console.error('Database reconnection failed:', retryError.message)
        }
      }
      
      if (!dbConnected) {
        // Return empty data if database is not available
        return (
          <div className="min-h-screen flex flex-col bg-white">
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
    }

    // Get hero slider posts (latest 5 active posts)
    const heroPostsData = await prisma.$queryRawUnsafe(`
      SELECT 
        p.id,
        p.img_url,
        p.status,
        p.view,
        pc.title,
        pc.title_sub,
        pc.post_date,
        a.id as author_id,
        COALESCE(ac.name_surname, CONCAT('Author #', a.id)) as author_name
      FROM \`post\` p
      LEFT JOIN \`post_content\` pc ON p.id = pc.post_id AND pc.lang_id = 'az'
      LEFT JOIN \`author\` a ON p.author = a.id
      LEFT JOIN \`author_content\` ac ON a.id = ac.author_id AND ac.lang_id = 'az'
      WHERE p.status = 1
      ORDER BY p.id DESC
      LIMIT 5
    `) as any[]

    // Get categories for hero posts
    const heroPostIds = heroPostsData.map((p: any) => p.id)
    let allHeroCategories: any[] = []
    
    if (heroPostIds.length > 0) {
      const heroPostIdsStr = heroPostIds.join(',')
      allHeroCategories = await prisma.$queryRawUnsafe(`
        SELECT 
          xpc.post_id,
          xpc.category_id,
          c.special_url,
          COALESCE(cc.title, c.special_url, CONCAT('Kateqoriya #', c.id)) as title
        FROM \`xref_post_category\` xpc
        LEFT JOIN \`category\` c ON xpc.category_id = c.id
        LEFT JOIN \`category_content\` cc ON c.id = cc.category_id AND cc.lang_id = 'az'
        WHERE xpc.post_id IN (${heroPostIdsStr})
      `) as any[]
    }

    const heroCategoriesByPostId = allHeroCategories.reduce((acc: any, cat: any) => {
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

    heroPosts = heroPostsData.map((post: any) => ({
      ...post,
      categories: heroCategoriesByPostId[post.id] || []
    }))

    // Get sidebar posts (next 5 posts)
    const sidebarPostsData = await prisma.$queryRawUnsafe(`
      SELECT 
        p.id,
        p.img_url,
        p.status,
        p.view,
        pc.title,
        pc.title_sub,
        pc.post_date,
        a.id as author_id,
        COALESCE(ac.name_surname, CONCAT('Author #', a.id)) as author_name
      FROM \`post\` p
      LEFT JOIN \`post_content\` pc ON p.id = pc.post_id AND pc.lang_id = 'az'
      LEFT JOIN \`author\` a ON p.author = a.id
      LEFT JOIN \`author_content\` ac ON a.id = ac.author_id AND ac.lang_id = 'az'
      WHERE p.status = 1 AND p.id NOT IN (${heroPostIds.join(',') || '0'})
      ORDER BY p.id DESC
      LIMIT 5
    `) as any[]

    // Get categories for sidebar posts
    const sidebarPostIds = sidebarPostsData.map((p: any) => p.id)
    let allSidebarCategories: any[] = []
    
    if (sidebarPostIds.length > 0) {
      const sidebarPostIdsStr = sidebarPostIds.join(',')
      allSidebarCategories = await prisma.$queryRawUnsafe(`
        SELECT 
          xpc.post_id,
          xpc.category_id,
          c.special_url,
          COALESCE(cc.title, c.special_url, CONCAT('Kateqoriya #', c.id)) as title
        FROM \`xref_post_category\` xpc
        LEFT JOIN \`category\` c ON xpc.category_id = c.id
        LEFT JOIN \`category_content\` cc ON c.id = cc.category_id AND cc.lang_id = 'az'
        WHERE xpc.post_id IN (${sidebarPostIdsStr})
      `) as any[]
    }

    const sidebarCategoriesByPostId = allSidebarCategories.reduce((acc: any, cat: any) => {
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

    sidebarPosts = sidebarPostsData.map((post: any) => ({
      ...post,
      categories: sidebarCategoriesByPostId[post.id] || []
    }))

    // Get editor's picks (next 3 posts after hero and sidebar)
    const allUsedIds = [...heroPostIds, ...sidebarPostIds]
    const picksData = await prisma.$queryRawUnsafe(`
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
      WHERE p.status = 1 AND p.id NOT IN (${allUsedIds.join(',') || '0'})
      ORDER BY p.id DESC
      LIMIT 3
    `) as any[]


    // Get categories for editor's picks
    const pickIds = picksData.map((p: any) => p.id)
    let allPickCategories: any[] = []
    
    if (pickIds.length > 0) {
      const pickIdsStr = pickIds.join(',')
      allPickCategories = await prisma.$queryRawUnsafe(`
        SELECT 
          xpc.post_id,
          xpc.category_id,
          c.special_url,
          COALESCE(cc.title, c.special_url, CONCAT('Kateqoriya #', c.id)) as title
        FROM \`xref_post_category\` xpc
        LEFT JOIN \`category\` c ON xpc.category_id = c.id
        LEFT JOIN \`category_content\` cc ON c.id = cc.category_id AND cc.lang_id = 'az'
        WHERE xpc.post_id IN (${pickIdsStr})
      `) as any[]
    }

    const categoriesByPostId = allPickCategories.reduce((acc: any, cat: any) => {
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

    editorPicks = picksData.map((post: any) => ({
      ...post,
      categories: categoriesByPostId[post.id] || []
    }))

    // Get latest news (next 6 posts)
    const latestData = await prisma.$queryRawUnsafe(`
      SELECT 
        p.id,
        p.img_url,
        p.status,
        p.view,
        pc.title,
        pc.title_sub,
        pc.post_date,
        a.id as author_id,
        COALESCE(ac.name_surname, CONCAT('Author #', a.id)) as author_name
      FROM \`post\` p
      LEFT JOIN \`post_content\` pc ON p.id = pc.post_id AND pc.lang_id = 'az'
      LEFT JOIN \`author\` a ON p.author = a.id
      LEFT JOIN \`author_content\` ac ON a.id = ac.author_id AND ac.lang_id = 'az'
      WHERE p.status = 1 AND p.id NOT IN (${allUsedIds.join(',') || '0'}, ${pickIds.join(',') || '0'})
      ORDER BY p.id DESC
      LIMIT 6
    `) as any[]

    // Get categories for latest news
    const latestIds = latestData.map((p: any) => p.id)
    let allLatestCategories: any[] = []
    
    if (latestIds.length > 0) {
      const latestIdsStr = latestIds.join(',')
      allLatestCategories = await prisma.$queryRawUnsafe(`
        SELECT 
          xpc.post_id,
          xpc.category_id,
          c.special_url,
          COALESCE(cc.title, c.special_url, CONCAT('Kateqoriya #', c.id)) as title
        FROM \`xref_post_category\` xpc
        LEFT JOIN \`category\` c ON xpc.category_id = c.id
        LEFT JOIN \`category_content\` cc ON c.id = cc.category_id AND cc.lang_id = 'az'
        WHERE xpc.post_id IN (${latestIdsStr})
      `) as any[]
    }

    const latestCategoriesByPostId = allLatestCategories.reduce((acc: any, cat: any) => {
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

    latestNews = latestData.map((post: any) => ({
      ...post,
      categories: latestCategoriesByPostId[post.id] || []
    }))

    // Get trending posts (by view count)
    const trendingData = await prisma.$queryRawUnsafe(`
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
      WHERE p.status = 1 AND p.id NOT IN (${allUsedIds.join(',') || '0'}, ${pickIds.join(',') || '0'}, ${latestIds.join(',') || '0'})
      ORDER BY p.view DESC, p.id DESC
      LIMIT 8
    `) as any[]

    // Get categories for trending
    const trendingIds = trendingData.map((p: any) => p.id)
    let allTrendingCategories: any[] = []
    
    if (trendingIds.length > 0) {
      const trendingIdsStr = trendingIds.join(',')
      allTrendingCategories = await prisma.$queryRawUnsafe(`
        SELECT 
          xpc.post_id,
          xpc.category_id,
          c.special_url,
          COALESCE(cc.title, c.special_url, CONCAT('Kateqoriya #', c.id)) as title
        FROM \`xref_post_category\` xpc
        LEFT JOIN \`category\` c ON xpc.category_id = c.id
        LEFT JOIN \`category_content\` cc ON c.id = cc.category_id AND cc.lang_id = 'az'
        WHERE xpc.post_id IN (${trendingIdsStr})
      `) as any[]
    }

    const trendingCategoriesByPostId = allTrendingCategories.reduce((acc: any, cat: any) => {
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

    trendingPosts = trendingData.map((post: any) => ({
      ...post,
      categories: trendingCategoriesByPostId[post.id] || []
    }))

    // Get all categories that have posts
    const allCategoriesWithPosts = await prisma.$queryRawUnsafe(`
      SELECT 
        c.id,
        c.special_url,
        COALESCE(cc.title, c.special_url, CONCAT('Kateqoriya #', c.id)) as title,
        (SELECT COUNT(*) FROM \`xref_post_category\` xpc WHERE xpc.category_id = c.id) as post_count
      FROM \`category\` c
      LEFT JOIN \`category_content\` cc ON c.id = cc.category_id AND cc.lang_id = 'az'
      WHERE c.status = 1
      AND (SELECT COUNT(*) FROM \`xref_post_category\` xpc WHERE xpc.category_id = c.id) > 0
      ORDER BY post_count DESC, c.sort_order
    `) as any[]

    // Get posts for all categories in a single optimized query (prevents connection issues)
    if (allCategoriesWithPosts.length > 0) {
      const categoryIds = allCategoriesWithPosts.map((c: any) => c.id).join(',')
      
      // Fetch all posts for all categories at once
      const allCategoryPosts = await prisma.$queryRawUnsafe(`
        SELECT 
          p.id,
          p.img_url,
          p.status,
          p.view,
          pc.title,
          pc.title_sub,
          pc.post_date,
          xpc.category_id
        FROM \`post\` p
        LEFT JOIN \`post_content\` pc ON p.id = pc.post_id AND pc.lang_id = 'az'
        INNER JOIN \`xref_post_category\` xpc ON p.id = xpc.post_id
        WHERE p.status = 1 
        AND xpc.category_id IN (${categoryIds})
        ORDER BY xpc.category_id, p.id DESC
      `) as any[]

      // Group posts by category and limit to 8 per category
      const postsByCategory: Record<number, any[]> = {}
      allCategoryPosts.forEach((post: any) => {
        const catId = post.category_id
        if (!postsByCategory[catId]) {
          postsByCategory[catId] = []
        }
        if (postsByCategory[catId].length < 8) {
          postsByCategory[catId].push({
            id: post.id,
            img_url: post.img_url,
            status: post.status,
            view: post.view,
            title: post.title,
            title_sub: post.title_sub,
            post_date: post.post_date
          })
        }
      })

      // Get all post IDs to fetch their categories in one query
      const allPostIds = [...new Set(allCategoryPosts.map((p: any) => p.id))]
      let allPostCategories: any[] = []
      
      if (allPostIds.length > 0) {
        const postIdsStr = allPostIds.join(',')
        allPostCategories = await prisma.$queryRawUnsafe(`
          SELECT 
            xpc.post_id,
            xpc.category_id,
            c.special_url,
            COALESCE(cc.title, c.special_url, CONCAT('Kateqoriya #', c.id)) as title
          FROM \`xref_post_category\` xpc
          LEFT JOIN \`category\` c ON xpc.category_id = c.id
          LEFT JOIN \`category_content\` cc ON c.id = cc.category_id AND cc.lang_id = 'az'
          WHERE xpc.post_id IN (${postIdsStr})
        `) as any[]
      }

      // Build categories map for posts
      const categoriesByPostId = allPostCategories.reduce((acc: any, cat: any) => {
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

      // Assign posts to category sections with categories
      allCategoriesWithPosts.forEach((category: any) => {
        const posts = postsByCategory[category.id] || []
        categorySections[category.id] = posts.map((post: any) => ({
          ...post,
          categories: categoriesByPostId[post.id] || []
        }))
      })
    }

    // Set categories list for display
    categories = allCategoriesWithPosts
  } catch (error: any) {
    console.error("Error fetching data:", error)
    // If it's a database connection error, show a user-friendly message
    if (error?.code === 'P1001' || error?.message?.includes("Can't reach database server")) {
      return (
        <div className="min-h-screen flex flex-col bg-white">
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
  }

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Header />
      
      <main className="flex-1">
        {/* Hero Section - Slider + Sidebar */}
        {(heroPosts.length > 0 || sidebarPosts.length > 0) && (
          <section className="border-b">
            <div className="container mx-auto px-4 py-8">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Hero Slider */}
                <div className="lg:col-span-2">
                  {heroPosts.length > 0 ? (
                    <HeroSlider posts={heroPosts} />
                  ) : (
                    <div className="w-full h-[600px] bg-gray-200 flex items-center justify-center">
                      <span className="text-6xl">📰</span>
                    </div>
                  )}
                </div>

                {/* Sidebar Posts */}
                <aside className="space-y-4">
                  {sidebarPosts.map((post, index) => {
                    const imageUrl = normalizeImageUrl(post.img_url)
                    return (
                      <div 
                        key={post.id} 
                        className="group flex gap-4 hover:bg-gray-50 p-2 rounded transition-colors"
                      >
                        <Link 
                          href={getPostUrl(post.id, null, post.title)}
                          className="relative w-24 h-24 flex-shrink-0 overflow-hidden bg-gray-100 rounded"
                        >
                          {imageUrl ? (
                            <Image
                              src={imageUrl}
                              alt={post.title || 'Xəbər'}
                              fill
                              sizes="96px"
                              className="object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gray-200">
                              <span className="text-xl">📰</span>
                            </div>
                          )}
                        </Link>
                        <div className="flex-1 min-w-0 space-y-1">
                          {post.categories && post.categories.length > 0 && (
                            <Link 
                              href={getCategoryUrl(post.categories[0].id, post.categories[0].slug, post.categories[0].slug)}
                              className="block"
                            >
                              <span className="text-xs font-semibold text-red-600 uppercase tracking-wider">
                                {post.categories[0].title}
                              </span>
                            </Link>
                          )}
                          <Link href={getPostUrl(post.id, null, post.title)}>
                            <h3 className="text-sm font-bold leading-tight line-clamp-2 group-hover:text-gray-700 transition-colors">
                              {post.title || 'Başlıq yoxdur'}
                            </h3>
                          </Link>
                          <div className="flex items-center gap-2 text-xs text-gray-500">
                            {post.post_date && (
                              <span>{format(new Date(post.post_date), "HH:mm")}</span>
                            )}
                            {post.view !== undefined && (
                              <>
                                <span>•</span>
                                <span>{post.view} baxış</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </aside>
              </div>
            </div>
          </section>
        )}

        {/* Editor's Picks */}
        {editorPicks.length > 0 && (
          <section className="border-b">
            <div className="container mx-auto px-4 py-12">
              <h2 className="text-3xl font-bold mb-8">Redaktorun Seçimi</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {editorPicks.map((post) => {
                  const imageUrl = normalizeImageUrl(post.img_url)
                  
                  return (
                    <div key={post.id} className="group">
                      <div className="space-y-3">
                        <Link href={getPostUrl(post.id, null, post.title)}>
                          <div className="relative w-full h-56 overflow-hidden bg-gray-100">
                            {imageUrl ? (
                              <Image
                                src={imageUrl}
                                alt={post.title || 'Xəbər'}
                                fill
                                sizes="(max-width: 768px) 100vw, 33vw"
                                className="object-cover group-hover:scale-105 transition-transform duration-300"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center bg-gray-200">
                                <span className="text-4xl">📰</span>
                              </div>
                            )}
                          </div>
                        </Link>
                        {post.categories && post.categories.length > 0 && (
                          <Link href={getCategoryUrl(post.categories[0].id, post.categories[0].slug, post.categories[0].slug)}>
                            <span className="text-xs font-semibold text-red-600 uppercase tracking-wider">
                              {post.categories[0].title}
                            </span>
                          </Link>
                        )}
                        <Link href={getPostUrl(post.id, null, post.title)}>
                          <h3 className="text-xl font-bold leading-tight group-hover:text-gray-700 transition-colors">
                            {post.title || 'Başlıq yoxdur'}
                          </h3>
                        </Link>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </section>
        )}

        {/* Latest News - Horizontal Layout */}
        {latestNews.length > 0 && (
          <section className="border-b bg-gray-50">
            <div className="container mx-auto px-4 py-12">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-3xl font-bold">Son Xəbərlər</h2>
                <Link href="/xeberler">
                  <Button variant="ghost" className="gap-2">
                    Hamısına Bax
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {latestNews.slice(0, 2).map((post) => {
                  const imageUrl = normalizeImageUrl(post.img_url)
                  
                  return (
                    <div key={post.id} className="group flex gap-6">
                      <Link href={getPostUrl(post.id, null, post.title)} className="relative w-48 h-48 flex-shrink-0 overflow-hidden bg-gray-100">
                        {imageUrl ? (
                          <Image
                            src={imageUrl}
                            alt={post.title || 'Xəbər'}
                            fill
                            sizes="192px"
                            className="object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gray-200">
                            <span className="text-3xl">📰</span>
                          </div>
                        )}
                      </Link>
                      <div className="flex-1 space-y-3">
                        {post.categories && post.categories.length > 0 && (
                          <Link href={getCategoryUrl(post.categories[0].id, post.categories[0].slug, post.categories[0].slug)}>
                            <span className="text-xs font-semibold text-red-600 uppercase tracking-wider">
                              {post.categories[0].title}
                            </span>
                          </Link>
                        )}
                        <Link href={getPostUrl(post.id, null, post.title)}>
                          <h3 className="text-2xl font-bold leading-tight group-hover:text-gray-700 transition-colors">
                            {post.title || 'Başlıq yoxdur'}
                          </h3>
                        </Link>
                        {post.title_sub && (
                          <p className="text-gray-700 leading-relaxed line-clamp-2">
                            {post.title_sub}
                          </p>
                        )}
                        <div className="flex items-center gap-3 text-xs text-gray-600 uppercase">
                          {post.author_name && (
                            <span>BY {post.author_name.toUpperCase()}</span>
                          )}
                          {post.post_date && (
                            <span>{format(new Date(post.post_date), "MMM d, yyyy")}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </section>
        )}

        {/* Trending Posts - Masonry Grid */}
        {trendingPosts.length > 0 && (
          <section className="border-b">
            <div className="container mx-auto px-4 py-12">
              <h2 className="text-3xl font-bold mb-8">Populyar</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {trendingPosts.slice(0, 8).map((post, index) => {
                  const imageUrl = normalizeImageUrl(post.img_url)
                  const isLarge = index === 0 || index === 4
                  
                  return (
                    <div 
                      key={post.id} 
                      className={`group ${isLarge ? 'md:col-span-2 md:row-span-2' : ''}`}
                    >
                      <div className="space-y-3 h-full">
                        <Link href={getPostUrl(post.id, null, post.title)}>
                          <div className={`relative w-full overflow-hidden bg-gray-100 ${isLarge ? 'h-64' : 'h-40'}`}>
                            {imageUrl ? (
                              <Image
                                src={imageUrl}
                                alt={post.title || 'Xəbər'}
                                fill
                                sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 25vw"
                                className="object-cover group-hover:scale-105 transition-transform duration-300"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center bg-gray-200">
                                <span className="text-3xl">📰</span>
                              </div>
                            )}
                          </div>
                        </Link>
                        {post.categories && post.categories.length > 0 && (
                          <Link href={getCategoryUrl(post.categories[0].id, post.categories[0].slug, post.categories[0].slug)}>
                            <span className="text-xs font-semibold text-red-600 uppercase tracking-wider">
                              {post.categories[0].title}
                            </span>
                          </Link>
                        )}
                        <Link href={getPostUrl(post.id, null, post.title)}>
                          <h3 className={`font-bold leading-tight group-hover:text-gray-700 transition-colors ${isLarge ? 'text-xl' : 'text-base'}`}>
                            {post.title || 'Başlıq yoxdur'}
                          </h3>
                        </Link>
                        {isLarge && post.title_sub && (
                          <p className="text-sm text-gray-600 line-clamp-2">
                            {post.title_sub}
                          </p>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </section>
        )}

        {/* Category Sections - Different Layouts */}
        {Object.entries(categorySections).map(([categoryId, posts], sectionIndex) => {
          if (posts.length === 0) return null
          
          const category = categories.find(c => c.id.toString() === categoryId)
          if (!category) return null

          // Alternate between different layouts
          const layoutType = sectionIndex % 3
          
          return (
            <section key={categoryId} className={`border-b ${sectionIndex % 2 === 0 ? 'bg-gray-50' : ''}`}>
              <div className="container mx-auto px-4 py-12">
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-3xl font-bold">{category.title}</h2>
                  <Link href={getCategoryUrl(parseInt(categoryId), category.special_url, category.special_url)}>
                    <Button variant="ghost" className="gap-2">
                      Hamısına Bax
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </Link>
                </div>

                {layoutType === 0 && (
                  /* Horizontal Scroll Layout */
                  <div className="overflow-x-auto pb-4">
                    <div className="flex gap-6 min-w-max">
                      {posts.slice(0, 8).map((post) => {
                        const imageUrl = normalizeImageUrl(post.img_url)
                        return (
                          <div key={post.id} className="group w-80 flex-shrink-0">
                            <div className="space-y-3">
                              <Link href={getPostUrl(post.id, null, post.title)}>
                                <div className="relative w-full h-48 overflow-hidden bg-gray-100">
                                  {imageUrl ? (
                                    <Image
                                      src={imageUrl}
                                      alt={post.title || 'Xəbər'}
                                      fill
                                      sizes="320px"
                                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                                    />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-gray-200">
                                      <span className="text-3xl">📰</span>
                                    </div>
                                  )}
                                </div>
                              </Link>
                              <Link href={getPostUrl(post.id, null, post.title)}>
                                <h3 className="text-lg font-bold leading-tight group-hover:text-gray-700 transition-colors line-clamp-2">
                                  {post.title || 'Başlıq yoxdur'}
                                </h3>
                              </Link>
                              {post.post_date && (
                                <p className="text-xs text-gray-500">
                                  {format(new Date(post.post_date), "MMM d, yyyy")}
                                </p>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}

                {layoutType === 1 && (
                  /* Asymmetric Grid Layout */
                  <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {posts.slice(0, 7).map((post, index) => {
                      const imageUrl = normalizeImageUrl(post.img_url)
                      const isLarge = index === 0
                      
                      return (
                        <Link 
                          key={post.id} 
                          href={getPostUrl(post.id, null, post.title)} 
                          className={`group ${isLarge ? 'md:col-span-2 md:row-span-2' : ''}`}
                        >
                          <div className="space-y-3 h-full">
                            <div className={`relative w-full overflow-hidden bg-gray-100 ${isLarge ? 'h-64' : 'h-40'}`}>
                              {imageUrl ? (
                                <Image
                                  src={imageUrl}
                                  alt={post.title || 'Xəbər'}
                                  fill
                                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center bg-gray-200">
                                  <span className="text-3xl">📰</span>
                                </div>
                              )}
                            </div>
                            <h3 className={`font-bold leading-tight group-hover:text-gray-700 transition-colors ${isLarge ? 'text-xl' : 'text-base'}`}>
                              {post.title || 'Başlıq yoxdur'}
                            </h3>
                            {isLarge && post.title_sub && (
                              <p className="text-sm text-gray-600 line-clamp-2">
                                {post.title_sub}
                              </p>
                            )}
                          </div>
                        </Link>
                      )
                    })}
                  </div>
                )}

                {layoutType === 2 && (
                  /* Vertical List Layout */
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {posts.slice(0, 6).map((post) => {
                      const imageUrl = normalizeImageUrl(post.img_url)
                      return (
                        <div key={post.id} className="group flex gap-4">
                          <Link href={getPostUrl(post.id, null, post.title)} className="relative w-24 h-24 flex-shrink-0 overflow-hidden bg-gray-100">
                            {imageUrl ? (
                              <Image
                                src={imageUrl}
                                alt={post.title || 'Xəbər'}
                                fill
                                sizes="96px"
                                className="object-cover group-hover:scale-105 transition-transform duration-300"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center bg-gray-200">
                                <span className="text-xl">📰</span>
                              </div>
                            )}
                          </Link>
                          <div className="flex-1 space-y-2">
                            {post.categories && post.categories.length > 0 && (
                              <Link href={getCategoryUrl(post.categories[0].id, post.categories[0].slug, post.categories[0].slug)}>
                                <span className="text-xs font-semibold text-red-600 uppercase tracking-wider">
                                  {post.categories[0].title}
                                </span>
                              </Link>
                            )}
                            <Link href={getPostUrl(post.id, null, post.title)}>
                              <h3 className="text-base font-bold leading-tight group-hover:text-gray-700 transition-colors line-clamp-2">
                                {post.title || 'Başlıq yoxdur'}
                              </h3>
                            </Link>
                            {post.post_date && (
                              <p className="text-xs text-gray-500">
                                {format(new Date(post.post_date), "MMM d, yyyy")}
                              </p>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </section>
          )
        })}

      </main>

      <Footer />
    </div>
  )
}
