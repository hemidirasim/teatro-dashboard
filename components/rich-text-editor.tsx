"use client"

import { useEditor, EditorContent } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import Image from "@tiptap/extension-image"
import { Card } from "@/components/ui/card"
import { Upload } from "lucide-react"
import { useState, useRef } from "react"
import axios from "axios"
import { toast } from "sonner"

interface RichTextEditorProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
}

export function RichTextEditor({ value, onChange, placeholder }: RichTextEditorProps) {
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const editor = useEditor({
    extensions: [
      StarterKit,
      Image.configure({
        inline: true,
        allowBase64: false,
      }),
    ],
    content: value,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML())
    },
    editorProps: {
      attributes: {
        class: "focus:outline-none min-h-[200px] p-4",
        "data-placeholder": placeholder || "Start typing...",
      },
    },
  })

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !editor) return

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
        const url = response.data.url
        editor.chain().focus().setImage({ src: url }).run()
        toast.success("Şəkil əlavə edildi")
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

  if (!editor) {
    return null
  }

  return (
    <Card className="border-2">
      <div className="border-b p-2 flex gap-2 flex-wrap">
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`px-2 py-1 rounded ${
            editor.isActive("bold") ? "bg-primary text-primary-foreground" : "bg-muted"
          }`}
        >
          <strong>B</strong>
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`px-2 py-1 rounded ${
            editor.isActive("italic") ? "bg-primary text-primary-foreground" : "bg-muted"
          }`}
        >
          <em>I</em>
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleStrike().run()}
          className={`px-2 py-1 rounded ${
            editor.isActive("strike") ? "bg-primary text-primary-foreground" : "bg-muted"
          }`}
        >
          <s>S</s>
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          className={`px-2 py-1 rounded ${
            editor.isActive("heading", { level: 1 }) ? "bg-primary text-primary-foreground" : "bg-muted"
          }`}
        >
          H1
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={`px-2 py-1 rounded ${
            editor.isActive("heading", { level: 2 }) ? "bg-primary text-primary-foreground" : "bg-muted"
          }`}
        >
          H2
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={`px-2 py-1 rounded ${
            editor.isActive("bulletList") ? "bg-primary text-primary-foreground" : "bg-muted"
          }`}
        >
          •
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={`px-2 py-1 rounded ${
            editor.isActive("orderedList") ? "bg-primary text-primary-foreground" : "bg-muted"
          }`}
        >
          1.
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          className={`px-2 py-1 rounded ${
            editor.isActive("blockquote") ? "bg-primary text-primary-foreground" : "bg-muted"
          }`}
        >
          "
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
          className="px-2 py-1 rounded bg-muted"
        >
          ─
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
          className="px-2 py-1 rounded bg-muted disabled:opacity-50"
        >
          ↶
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
          className="px-2 py-1 rounded bg-muted disabled:opacity-50"
        >
          ↷
        </button>
        <div className="border-l pl-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            disabled={uploading}
            className="hidden"
            id="editor-image-upload"
          />
          <label htmlFor="editor-image-upload">
            <button
              type="button"
              disabled={uploading}
              className="px-2 py-1 rounded bg-muted hover:bg-muted/80 disabled:opacity-50 flex items-center gap-1"
            >
              <Upload className="h-4 w-4" />
              {uploading ? "Yüklənir..." : "Şəkil"}
            </button>
          </label>
        </div>
      </div>
      <EditorContent editor={editor} />
    </Card>
  )
}

