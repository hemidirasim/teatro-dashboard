"use client"

import { useState, useEffect, useRef } from "react"
import { Search, X, Loader2 } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import Image from "next/image"
import { format } from "date-fns"
import { normalizeImageUrl } from "@/lib/image-utils"
import { getPostUrl } from "@/lib/slug-utils"
import axios from "axios"

interface SearchResult {
  id: number
  title: string
  title_sub?: string
  img_url?: string
  post_date?: string
  categories: Array<{ id: number; title: string; slug?: string }>
}

export function SearchDialog() {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [debounceTimer, setDebounceTimer] = useState<NodeJS.Timeout | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open && inputRef.current) {
      inputRef.current.focus()
    }
  }, [open])

  useEffect(() => {
    if (debounceTimer) {
      clearTimeout(debounceTimer)
    }

    if (query.trim().length === 0) {
      setResults([])
      setLoading(false)
      return
    }

    if (query.trim().length < 2) {
      setResults([])
      return
    }

    setLoading(true)
    const timer = setTimeout(async () => {
      try {
        const response = await axios.get(`/api/search?q=${encodeURIComponent(query)}&limit=10`)
        setResults(response.data.data || [])
      } catch (error) {
        console.error("Search error:", error)
        setResults([])
      } finally {
        setLoading(false)
      }
    }, 300)

    setDebounceTimer(timer)

    return () => {
      if (debounceTimer) {
        clearTimeout(debounceTimer)
      }
    }
  }, [query])

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen)
    if (!isOpen) {
      setQuery("")
      setResults([])
    }
  }

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        className="text-gray-600 hover:text-black transition-colors"
        onClick={() => setOpen(true)}
      >
        <Search className="h-5 w-5" />
      </Button>

      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="sm:max-w-[600px] p-0">
          <DialogHeader className="px-6 pt-6 pb-4 border-b">
            <DialogTitle>Axtarış</DialogTitle>
          </DialogHeader>
          
          <div className="px-6 pt-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                ref={inputRef}
                type="text"
                placeholder="Axtarış..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="pl-10 pr-10"
              />
              {query && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 top-1/2 transform -translate-y-1/2 h-7 w-7"
                  onClick={() => setQuery("")}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>

          <div className="px-6 pb-6 max-h-[400px] overflow-y-auto">
            {loading && (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
              </div>
            )}

            {!loading && query.trim().length > 0 && query.trim().length < 2 && (
              <div className="text-center py-8 text-sm text-gray-500">
                Minimum 2 simvol daxil edin
              </div>
            )}

            {!loading && query.trim().length >= 2 && results.length === 0 && (
              <div className="text-center py-8 text-sm text-gray-500">
                Nəticə tapılmadı
              </div>
            )}

            {!loading && results.length > 0 && (
              <div className="space-y-4 pt-4">
                {results.map((post) => {
                  const imageUrl = normalizeImageUrl(post.img_url)
                  return (
                    <Link
                      key={post.id}
                      href={getPostUrl(post.id, null, post.title)}
                      onClick={() => handleOpenChange(false)}
                      className="block group"
                    >
                      <div className="flex gap-4 hover:bg-gray-50 p-3 rounded-lg transition-colors">
                        {imageUrl && (
                          <div className="relative w-20 h-20 flex-shrink-0 overflow-hidden bg-gray-100 rounded">
                            <Image
                              src={imageUrl}
                              alt={post.title || 'Xəbər'}
                              fill
                              sizes="80px"
                              className="object-cover"
                            />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          {post.categories && post.categories.length > 0 && (
                            <div className="text-xs font-semibold text-red-600 uppercase tracking-wider mb-1">
                              {post.categories[0].title}
                            </div>
                          )}
                          <h3 className="text-sm font-bold leading-tight line-clamp-2 group-hover:text-gray-700 transition-colors mb-1">
                            {post.title || 'Başlıq yoxdur'}
                          </h3>
                          {post.title_sub && (
                            <p className="text-xs text-gray-600 line-clamp-1 mb-1">
                              {post.title_sub}
                            </p>
                          )}
                          {post.post_date && (
                            <div className="text-xs text-gray-500">
                              {format(new Date(post.post_date), "dd.MM.yyyy")}
                            </div>
                          )}
                        </div>
                      </div>
                    </Link>
                  )
                })}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

