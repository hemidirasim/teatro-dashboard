/**
 * Generate URL-friendly slug from text
 */
export function generateSlug(text: string | null | undefined): string {
  if (!text) return ''
  
  return text
    .toLowerCase()
    .trim()
    // Azerbaijani characters
    .replace(/ə/g, 'e')
    .replace(/ı/g, 'i')
    .replace(/ö/g, 'o')
    .replace(/ü/g, 'u')
    .replace(/ğ/g, 'g')
    .replace(/ş/g, 's')
    .replace(/ç/g, 'c')
    // Remove special characters
    .replace(/[^\w\s-]/g, '')
    // Replace spaces and multiple dashes with single dash
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
    // Remove leading/trailing dashes
    .replace(/^-+|-+$/g, '')
}

/**
 * Generate category URL
 */
export function getCategoryUrl(categoryId: number, slug: string | null | undefined, specialUrl: string | null | undefined): string {
  // Use specialUrl if available, otherwise use slug, otherwise generate default
  const categorySlug = (specialUrl && specialUrl.trim()) || slug || `category-${categoryId}`
  // Generate slug from the categorySlug to ensure URL-friendly format
  const finalSlug = generateSlug(categorySlug) || `category-${categoryId}`
  return `/az/category/${finalSlug}-${categoryId}`
}

/**
 * Generate post URL
 */
export function getPostUrl(postId: number, slug: string | null | undefined, title: string | null | undefined): string {
  const postSlug = slug || generateSlug(title) || `post-${postId}`
  return `/az/post/${postSlug}-${postId}`
}

/**
 * Parse slug and ID from URL
 */
export function parseSlugId(urlSlug: string): { slug: string; id: number } | null {
  const match = urlSlug.match(/^(.+)-(\d+)$/)
  if (!match) return null
  
  return {
    slug: match[1],
    id: parseInt(match[2])
  }
}

