"use client"

import Link from "next/link"
import Image from "next/image"
import { format } from "date-fns"
import { Calendar, Eye } from "lucide-react"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { useState } from "react"
import { normalizeImageUrl } from "@/lib/image-utils"
import { getPostUrl, getCategoryUrl, generateSlug } from "@/lib/slug-utils"

interface PostCardProps {
  post: {
    id: number
    title: string
    title_sub?: string
    img_url?: string
    post_date?: string
    view?: number
    categories?: Array<{ id: number; title: string; slug?: string | null }>
  }
}

export function PostCard({ post }: PostCardProps) {
  const [imageError, setImageError] = useState(false)
  const imageUrl = normalizeImageUrl(post.img_url)

  const postUrl = getPostUrl(post.id, null, post.title)

  return (
    <Card className="group overflow-hidden hover:shadow-lg transition-shadow duration-300 h-full flex flex-col">
      <Link href={postUrl} className="block">
        <div className="relative w-full h-48 overflow-hidden bg-muted">
          {imageUrl && !imageError ? (
            <Image
              src={imageUrl}
              alt={post.title || 'Xəbər'}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
              onError={() => setImageError(true)}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900 dark:to-purple-900">
              <span className="text-4xl">📰</span>
            </div>
          )}
        </div>
      </Link>
      <CardContent className="p-4 flex-1 flex flex-col">
        <div className="flex flex-wrap gap-2 mb-2">
          {post.categories?.slice(0, 2).map((cat: any) => (
            <Link
              key={cat.id}
              href={getCategoryUrl(cat.id, cat.slug || null, cat.slug || null)}
              className="inline-block"
            >
              <span className="px-2 py-1 text-xs bg-primary/10 text-primary rounded-full hover:bg-primary/20 transition-colors">
                {cat.title}
              </span>
            </Link>
          ))}
        </div>
        <Link href={postUrl} className="block">
          <h3 className="font-semibold text-lg mb-2 line-clamp-2 group-hover:text-primary transition-colors">
            {post.title || 'Başlıq yoxdur'}
          </h3>
        </Link>
        {post.title_sub && (
          <Link href={postUrl} className="block">
            <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
              {post.title_sub}
            </p>
          </Link>
        )}
      </CardContent>
      <CardFooter className="p-4 pt-0 flex items-center justify-between text-xs text-muted-foreground">
        <div className="flex items-center gap-1">
          <Calendar className="h-3 w-3" />
          {post.post_date 
            ? format(new Date(post.post_date), "dd MMM yyyy")
            : '-'}
        </div>
        {post.view !== undefined && (
          <div className="flex items-center gap-1">
            <Eye className="h-3 w-3" />
            {post.view}
          </div>
        )}
      </CardFooter>
    </Card>
  )
}

