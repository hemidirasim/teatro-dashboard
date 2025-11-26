"use client"

import { useState } from "react"

interface PostImageProps {
  src: string
  alt: string
  className?: string
}

export function PostImage({ src, alt, className }: PostImageProps) {
  const [error, setError] = useState(false)

  if (error || !src) {
    return (
      <div className="w-20 h-20 bg-muted rounded flex items-center justify-center">
        <span className="text-xs text-muted-foreground">Şəkil yox</span>
      </div>
    )
  }

  // Clean up the src path
  const imageSrc = src.startsWith('/') ? src : `/${src}`

  return (
    <div className="relative">
      <img 
        src={imageSrc} 
        alt={alt || 'Xəbər şəkli'} 
        className={className || "w-20 h-20 object-cover rounded border"}
        onError={() => setError(true)}
        loading="lazy"
      />
    </div>
  )
}

