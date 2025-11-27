"use client"

import Link from "next/link"
import { useState, useEffect } from "react"
import { Menu, X, ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { SearchDialog } from "./search-dialog"

interface MenuItem {
  id: number
  parentId: number | null
  title: string
  url: string
  sortOrder: number
  children: MenuItem[]
}

interface HeaderClientProps {
  menuItems: MenuItem[]
}

export function HeaderClient({ menuItems }: HeaderClientProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50)
    }

    // Set initial scroll state
    handleScroll()

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const renderMenuItem = (item: MenuItem, isMobile = false) => {
    const hasChildren = item.children && item.children.length > 0
    
    if (isMobile) {
      return (
        <div key={item.id} className="space-y-2">
          {hasChildren ? (
            <div>
              <div className="flex items-center justify-between py-2">
                <Link
                  href={item.url.startsWith('/') ? item.url : `/${item.url}`}
                  className="text-sm font-medium"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {item.title}
                </Link>
              </div>
              <div className="pl-4 space-y-1">
                {item.children.map((child) => (
                  <Link
                    key={child.id}
                    href={child.url.startsWith('/') ? child.url : `/${child.url}`}
                    className="block py-1 text-sm text-muted-foreground"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {child.title}
                  </Link>
                ))}
              </div>
            </div>
          ) : (
            <Link
              href={item.url.startsWith('/') ? item.url : `/${item.url}`}
              className="block py-2 text-sm font-medium"
              onClick={() => setMobileMenuOpen(false)}
            >
              {item.title}
            </Link>
          )}
        </div>
      )
    }

    // Desktop rendering
    if (hasChildren) {
      return (
        <DropdownMenu key={item.id}>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="gap-1">
              {item.title}
              <ChevronDown className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            {item.children.map((child) => (
              <DropdownMenuItem key={child.id} asChild>
                <Link href={child.url.startsWith('/') ? child.url : `/${child.url}`}>
                  {child.title}
                </Link>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      )
    }

    return (
      <Link
        key={item.id}
        href={item.url.startsWith('/') ? item.url : `/${item.url}`}
        className="text-sm font-medium transition-colors hover:text-primary"
      >
        {item.title}
      </Link>
    )
  }

  return (
    <>
      {/* Main Header - Not sticky */}
      <div className="w-full bg-white">
        <div className="container mx-auto px-4">
          {/* Logo - Centered - Hidden when scrolled */}
          <div className={`flex flex-col justify-center items-center transition-all duration-300 ${isMounted && isScrolled ? 'hidden' : 'py-6'}`}>
            <Link href="/" className="flex flex-col items-center">
              <div className="text-4xl font-bold text-black">
                Teatro.az
              </div>
              <div className="text-sm font-semibold text-gray-700 uppercase tracking-wider mt-1">
                SƏNƏT PORTALI
              </div>
            </Link>
          </div>
        </div>
      </div>

      {/* Navigation - Sticky Menu */}
      <nav className="sticky top-0 z-[100] w-full bg-white border-b transition-all duration-300" style={isMounted ? { paddingTop: isScrolled ? '0.75rem' : '1rem', paddingBottom: isScrolled ? '0.75rem' : '1rem', boxShadow: isScrolled ? '0 1px 3px 0 rgba(0, 0, 0, 0.1)' : 'none' } : { paddingTop: '1rem', paddingBottom: '1rem' }}>
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between">
            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center space-x-6 flex-1 justify-center">
              {menuItems.map((item) => renderMenuItem(item, false))}
            </div>

            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>

            {/* Search Button - Right side */}
            <div className="flex items-center">
              <SearchDialog />
            </div>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className="lg:hidden py-4 space-y-4 border-t">
              {menuItems.map((item) => renderMenuItem(item, true))}
            </div>
          )}
        </div>
      </nav>
    </>
  )
}

