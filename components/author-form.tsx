"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ImageUpload } from "@/components/image-upload"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import axios from "axios"
import { useRouter } from "next/navigation"
import { useState } from "react"

const authorSchema = z.object({
  img_url: z.string().min(1, "Şəkil tələb olunur"),
  name_surname: z.string().min(1, "Ad Soyad tələb olunur"),
  post: z.string().optional(),
  sort_order: z.coerce.number().optional(),
  status: z.coerce.number().default(1),
  lang_id: z.string().default("az"),
})

type AuthorFormData = z.infer<typeof authorSchema>

interface AuthorFormProps {
  initialData?: any
  languages: any[]
}

export function AuthorForm({ initialData, languages }: AuthorFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<AuthorFormData>({
    resolver: zodResolver(authorSchema),
    defaultValues: {
      img_url: initialData?.img_url || "",
      name_surname: initialData?.name_surname || "",
      post: initialData?.post || "",
      sort_order: initialData?.sort_order || undefined,
      status: initialData?.status ?? 1,
      lang_id: initialData?.lang_id || "az",
    },
  })

  const onSubmit = async (data: AuthorFormData) => {
    setLoading(true)
    try {
      const payload = {
        ...data,
        lang_id: "az", // Default az dili
        sort_order: data.sort_order || null,
      }

      if (initialData) {
        await axios.put(`/api/authors/${initialData.id}`, payload)
        toast.success("Müəllif yeniləndi")
      } else {
        await axios.post("/api/authors", payload)
        toast.success("Müəllif əlavə edildi")
      }
      router.push("/admin/authors")
      router.refresh()
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Xəta baş verdi")
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="name_surname">Ad Soyad *</Label>
          <Input
            id="name_surname"
            {...register("name_surname")}
            placeholder="Müəllif adı və soyadı"
          />
          {errors.name_surname && (
            <p className="text-sm text-destructive">{errors.name_surname.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="post">Vəzifə</Label>
          <Input
            id="post"
            {...register("post")}
            placeholder="Məsələn: Teatrşünas, Rejissor"
          />
        </div>
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

      <div className="grid gap-4 md:grid-cols-2">
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

