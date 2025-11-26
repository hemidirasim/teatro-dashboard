"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Upload, X } from "lucide-react"
import { toast } from "sonner"
import axios from "axios"

interface ImageUploadProps {
  value?: string
  onChange: (url: string) => void
  label?: string
}

export function ImageUpload({ value, onChange, label = "Şəkil" }: ImageUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [preview, setPreview] = useState<string | null>(value || null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast.error("Yalnız şəkil faylları yüklənə bilər")
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Şəkil ölçüsü 5MB-dan böyük ola bilməz")
      return
    }

    setUploading(true)

    try {
      const formData = new FormData()
      formData.append("file", file)

      const response = await axios.post("/api/upload", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      })

      if (response.data.success) {
        const url = response.data.path
        onChange(url)
        setPreview(`/${url}`)
        toast.success("Şəkil yükləndi")
      } else {
        throw new Error("Upload failed")
      }
    } catch (error: any) {
      console.error("Upload error:", error)
      toast.error(error.response?.data?.error || "Şəkil yüklənərkən xəta baş verdi")
    } finally {
      setUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    }
  }

  const handleRemove = () => {
    onChange("")
    setPreview(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="flex items-center gap-4">
        {preview ? (
          <div className="relative">
            <img
              src={preview}
              alt="Preview"
              className="w-32 h-32 object-cover rounded border"
            />
            <Button
              type="button"
              variant="destructive"
              size="icon"
              className="absolute -top-2 -right-2 h-6 w-6"
              onClick={handleRemove}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <div className="w-32 h-32 border-2 border-dashed rounded flex items-center justify-center">
            <Upload className="h-8 w-8 text-muted-foreground" />
          </div>
        )}
        <div className="flex-1">
          <Input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            disabled={uploading}
            className="hidden"
            id="image-upload"
          />
          <div>
            <Button
              type="button"
              variant="outline"
              disabled={uploading}
              onClick={() => fileInputRef.current?.click()}
            >
              {uploading ? "Yüklənir..." : "Şəkil Seç"}
            </Button>
          </div>
          {value && (
            <p className="text-sm text-muted-foreground mt-2">
              {value}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

