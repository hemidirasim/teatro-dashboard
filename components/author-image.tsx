"use client"

import { useState } from "react"

interface AuthorImageProps {
  src: string
  alt: string
  className?: string
}

export function AuthorImage({ src, alt, className }: AuthorImageProps) {
  const [error, setError] = useState(false)

  if (error || !src) {
    return <span className="text-muted-foreground">-</span>
  }

  return (
    <img 
      src={`/${src}`} 
      alt={alt} 
      className={className}
      onError={() => setError(true)}
    />
  )
}

