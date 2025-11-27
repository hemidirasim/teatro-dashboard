import { prisma } from "@/lib/prisma"
import { parseSlugId, generateSlug } from "@/lib/slug-utils"
import { permanentRedirect } from "next/navigation"

interface PageProps {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ page?: string }>
}

export default async function CategoryRedirectPage(props: PageProps) {
  const params = await props.params
  const searchParams = await props.searchParams
  
  try {
    // Test database connection first
    try {
      await prisma.$queryRawUnsafe('SELECT 1')
    } catch (dbError: any) {
      console.error('Database connection failed:', dbError.message)
      // Redirect to home if database connection fails
      permanentRedirect("/")
      return // This will never execute, but TypeScript needs it
    }

    const parsed = parseSlugId(params.slug)

    if (!parsed || !parsed.id) {
      permanentRedirect("/")
      return // This will never execute, but TypeScript needs it
    }

    const categoryId = parsed.id

    const categories = await prisma.$queryRawUnsafe(`
      SELECT 
        c.id,
        c.special_url
      FROM \`category\` c
      WHERE c.id = ${categoryId}
      LIMIT 1
    `) as any[]

    if (categories.length === 0) {
      permanentRedirect("/")
      return // This will never execute, but TypeScript needs it
    }

    const category = categories[0]
    
    // Generate proper slug
    const categorySlug = generateSlug(category.special_url || parsed.slug || `category-${category.id}`) || `category-${category.id}`
    const newUrl = `/az/category/${categorySlug}-${category.id}`
    
    // Preserve page query parameter if exists
    const page = await searchParams
    const pageParam = page.page ? `?page=${page.page}` : ""
    
    // Use permanentRedirect for SEO-friendly permanent redirects
    // Note: This will throw NEXT_REDIRECT error, which is normal Next.js behavior
    permanentRedirect(newUrl + pageParam)
    return // This will never execute, but TypeScript needs it
  } catch (error: any) {
    // Check if it's a redirect error (normal Next.js behavior)
    if (error?.digest === 'NEXT_REDIRECT' || error?.message === 'NEXT_REDIRECT') {
      // Re-throw redirect errors - they are expected
      throw error
    }
    
    console.error("Error redirecting category:", error)
    // If it's a database connection error, redirect to home
    if (error?.code === 'P1001' || error?.message?.includes("Can't reach database server")) {
      permanentRedirect("/")
      return // This will never execute, but TypeScript needs it
    }
    permanentRedirect("/")
    return // This will never execute, but TypeScript needs it
  }
}

