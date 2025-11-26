"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { RichTextEditor } from "@/components/rich-text-editor"
import { ImageUpload } from "@/components/image-upload"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { toast } from "sonner"
import axios from "axios"
import { useRouter } from "next/navigation"
import { useState } from "react"

const postSchema = z.object({
  img_url: z.string().min(1, "Şəkil URL tələb olunur"),
  title: z.string().min(1, "Başlıq tələb olunur"),
  title_sub: z.string().optional(),
  content: z.string().min(1, "Məzmun tələb olunur"),
  author: z.coerce.number().optional(),
  sort_order: z.coerce.number().optional(),
  status: z.coerce.number().default(1),
  post_date: z.string().optional(),
  lang_id: z.string().default("az"),
  category_ids: z.array(z.number()).optional(),
})

type PostFormData = z.infer<typeof postSchema>

interface PostFormProps {
  initialData?: any
  authors: any[]
  categories: any[]
  languages: any[]
}

export function PostForm({ initialData, authors, categories, languages }: PostFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [content, setContent] = useState(initialData?.content || "")

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<PostFormData>({
    resolver: zodResolver(postSchema),
    defaultValues: {
      img_url: initialData?.img_url || "",
      title: initialData?.title || "",
      title_sub: initialData?.title_sub || "",
      content: initialData?.content || "",
      author: initialData?.author || undefined,
      sort_order: initialData?.sort_order || undefined,
      status: initialData?.status ?? 1,
      post_date: initialData?.post_date 
        ? new Date(initialData.post_date).toISOString().slice(0, 16)
        : new Date().toISOString().slice(0, 16),
      lang_id: initialData?.lang_id || "az",
      category_ids: initialData?.category_ids || [],
    },
  })

  const selectedCategories = watch("category_ids") || []

  const onSubmit = async (data: PostFormData) => {
    setLoading(true)
    try {
      const payload = {
        ...data,
        content,
        post_date: data.post_date || new Date().toISOString(),
        lang_id: "az", // Default az dili
        sort_order: data.sort_order || null, // Sıra optional
      }

      if (initialData) {
        await axios.put(`/api/posts/${initialData.id}`, payload)
        toast.success("Xəbər yeniləndi")
      } else {
        await axios.post("/api/posts", payload)
        toast.success("Xəbər əlavə edildi")
      }
      router.push("/admin/posts")
      router.refresh()
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Xəta baş verdi")
    } finally {
      setLoading(false)
    }
  }

  const toggleCategory = (categoryId: number) => {
    const current = selectedCategories
    const updated = current.includes(categoryId)
      ? current.filter((id) => id !== categoryId)
      : [...current, categoryId]
    setValue("category_ids", updated)
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="title">Başlıq *</Label>
          <Input
            id="title"
            {...register("title")}
            placeholder="Xəbər başlığı"
          />
          {errors.title && (
            <p className="text-sm text-destructive">{errors.title.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <ImageUpload
            value={watch("img_url")}
            onChange={(url) => setValue("img_url", url)}
            label="Şəkil *"
          />
          {errors.img_url && (
            <p className="text-sm text-destructive">{errors.img_url.message}</p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="title_sub">Alt Başlıq</Label>
        <Input
          id="title_sub"
          {...register("title_sub")}
          placeholder="Qısa təsvir"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="content">Məzmun *</Label>
        <RichTextEditor
          value={content}
          onChange={(value) => {
            setContent(value)
            setValue("content", value)
          }}
          placeholder="Xəbər məzmunu"
        />
        {errors.content && (
          <p className="text-sm text-destructive">{errors.content.message}</p>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="author">Müəllif</Label>
          <Select
            value={watch("author")?.toString() || undefined}
            onValueChange={(value) => {
              if (value === "none") {
                setValue("author", undefined)
              } else {
                setValue("author", parseInt(value))
              }
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Müəllif seçin" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Müəllif yoxdur</SelectItem>
              {authors.map((author) => (
                <SelectItem key={author.id} value={author.id.toString()}>
                  {author.name || `Müəllif #${author.id}`}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="post_date">Tarix</Label>
          <Input
            id="post_date"
            type="datetime-local"
            {...register("post_date")}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="status">Status</Label>
          <Select
            value={watch("status")?.toString() || "1"}
            onValueChange={(value) => setValue("status", parseInt(value))}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">Aktiv</SelectItem>
              <SelectItem value="0">Qeyri-aktiv</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>


      <div className="space-y-2">
        <Label>Kateqoriyalar</Label>
        <div className="grid gap-2 md:grid-cols-3 border rounded-lg p-4 max-h-60 overflow-y-auto">
          {categories.map((category) => (
            <div key={category.id} className="flex items-center space-x-2">
              <Checkbox
                id={`cat-${category.id}`}
                checked={selectedCategories.includes(category.id)}
                onCheckedChange={() => toggleCategory(category.id)}
              />
              <label
                htmlFor={`cat-${category.id}`}
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
              >
                {category.title || category.special_url || `Kateqoriya #${category.id}`}
              </label>
            </div>
          ))}
        </div>
      </div>

      <div className="flex gap-4">
        <Button type="submit" disabled={loading}>
          {loading ? "Yadda saxlanılır..." : initialData ? "Yenilə" : "Yadda Saxla"}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
        >
          Ləğv et
        </Button>
      </div>
    </form>
  )
}

