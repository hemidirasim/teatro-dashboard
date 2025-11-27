"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { format } from "date-fns"
import { ChevronLeft, ChevronRight, Eye } from "lucide-react"
import { Button } from "@/components/ui/button"
import { getPostUrl, getCategoryUrl } from "@/lib/slug-utils"
import { normalizeImageUrl } from "@/lib/image-utils"

interface HeroPost {
  id: number
  title: string
  title_sub?: string
  img_url?: string
  post_date?: string
  view?: number
  author_name?: string
  categories?: Array<{ id: number; title: string; slug?: string | null }>
}

interface HeroSliderProps {
  posts: HeroPost[]
}

export function HeroSlider({ posts }: HeroSliderProps) {
  const [currentIndex, setCurrentIndex] = useState(0)

  useEffect(() => {
    if (posts.length <= 1) return

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % posts.length)
    }, 5000) // Change slide every 5 seconds

    return () => clearInterval(interval)
  }, [posts.length])

  if (posts.length === 0) return null

  const currentPost = posts[currentIndex]
  const imageUrl = normalizeImageUrl(currentPost.img_url)

  return (
    <div className="relative w-full h-[600px] overflow-hidden bg-gray-100">
      {imageUrl ? (
        <Image
          src={imageUrl}
          alt={currentPost.title || 'Xəbər'}
          fill
          sizes="(max-width: 768px) 100vw, 66vw"
          className="object-cover"
          priority
          loading="eager"
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-gray-200">
          <span className="text-6xl">📰</span>
        </div>
      )}
      
      {/* Overlay gradient */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
      
      {/* Content */}
      <div className="absolute bottom-0 left-0 right-0 p-8 text-white">
        {currentPost.categories && currentPost.categories.length > 0 && (
          <Link 
            href={getCategoryUrl(currentPost.categories[0].id, currentPost.categories[0].slug, currentPost.categories[0].slug)}
            className="inline-block mb-3"
          >
            <span className="text-xs font-semibold text-red-400 uppercase tracking-wider">
              {currentPost.categories[0].title}
            </span>
          </Link>
        )}
        
        <Link href={getPostUrl(currentPost.id, null, currentPost.title)}>
          <h1 className="text-4xl lg:text-5xl font-bold mb-4 leading-tight hover:text-gray-200 transition-colors">
            {currentPost.title || 'Başlıq yoxdur'}
          </h1>
        </Link>
        
        {currentPost.title_sub && (
          <p className="text-lg mb-4 line-clamp-2">
            {currentPost.title_sub}
          </p>
        )}
        
        <div className="flex items-center gap-4 text-sm text-gray-300">
          {currentPost.post_date && (
            <span>{format(new Date(currentPost.post_date), "HH:mm")}</span>
          )}
          {currentPost.view !== undefined && (
            <div className="flex items-center gap-1">
              <Eye className="h-4 w-4" />
              <span>{currentPost.view}</span>
            </div>
          )}
          {currentPost.author_name && (
            <span>• {currentPost.author_name}</span>
          )}
        </div>
      </div>

      {/* Navigation */}
      {posts.length > 1 && (
        <>
          <Button
            variant="ghost"
            size="icon"
            className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white"
            onClick={() => setCurrentIndex((prev) => (prev - 1 + posts.length) % posts.length)}
          >
            <ChevronLeft className="h-6 w-6" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white"
            onClick={() => setCurrentIndex((prev) => (prev + 1) % posts.length)}
          >
            <ChevronRight className="h-6 w-6" />
          </Button>

          {/* Dots indicator */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
            {posts.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={`h-2 rounded-full transition-all ${
                  index === currentIndex ? 'w-8 bg-white' : 'w-2 bg-white/50'
                }`}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  )
}

