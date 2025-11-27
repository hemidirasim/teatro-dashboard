/**
 * Normalizes image URLs to be compatible with Next.js Image component
 * Handles protocol-relative URLs (//), absolute URLs, and relative URLs
 */
export function normalizeImageUrl(url: string | null | undefined): string | null {
  if (!url) return null
  
  // Remove protocol-relative URLs (//) - convert to https
  if (url.startsWith('//')) {
    url = `https:${url}`
  }
  
  // Handle absolute URLs
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url
  }
  
  // Handle relative URLs starting with /
  if (url.startsWith('/')) {
    return url
  }
  
  // Add leading slash for relative paths
  return `/${url}`
}

