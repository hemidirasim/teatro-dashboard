"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import axios from "axios"
import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"

const settingsSchema = z.object({
  about_text: z.string().min(1, "Haqqımızda mətn tələb olunur"),
  email: z.string().email("Düzgün email ünvanı daxil edin"),
  phone: z.string().min(1, "Telefon nömrəsi tələb olunur"),
  address: z.string().optional(),
  copyright: z.string().min(1, "Copyright mətn tələb olunur"),
})

type SettingsFormData = z.infer<typeof settingsSchema>

interface SettingsFormProps {
  initialData?: {
    about_text?: string
    email?: string
    phone?: string
    address?: string
    copyright?: string
  }
}

export function SettingsForm({ initialData }: SettingsFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<SettingsFormData>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      about_text: initialData?.about_text || "",
      email: initialData?.email || "",
      phone: initialData?.phone || "",
      address: initialData?.address || "",
      copyright: initialData?.copyright || "Teatro",
    },
  })

  useEffect(() => {
    if (initialData) {
      reset(initialData)
    }
  }, [initialData, reset])

  const onSubmit = async (data: SettingsFormData) => {
    setLoading(true)
    try {
      await axios.put("/api/settings", data)
      toast.success("Parametrlər yeniləndi")
      router.refresh()
    } catch (error: any) {
      console.error("Form submit error:", error)
      const errorMessage = error.response?.data?.error || error.message || "Xəta baş verdi"
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="about_text">Haqqımızda</Label>
        <Textarea
          id="about_text"
          {...register("about_text")}
          placeholder="Haqqımızda mətn"
          rows={5}
        />
        {errors.about_text && (
          <p className="text-sm text-destructive">{errors.about_text.message}</p>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            {...register("email")}
            placeholder="info@teatro.az"
          />
          {errors.email && (
            <p className="text-sm text-destructive">{errors.email.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="phone">Telefon</Label>
          <Input
            id="phone"
            {...register("phone")}
            placeholder="+994 12 123 45 67"
          />
          {errors.phone && (
            <p className="text-sm text-destructive">{errors.phone.message}</p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="address">Ünvan (İstəyə bağlı)</Label>
        <Input
          id="address"
          {...register("address")}
          placeholder="Ünvan"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="copyright">Copyright</Label>
        <Input
          id="copyright"
          {...register("copyright")}
          placeholder="Teatro"
        />
        {errors.copyright && (
          <p className="text-sm text-destructive">{errors.copyright.message}</p>
        )}
      </div>

      <div className="flex gap-4">
        <Button type="submit" disabled={loading}>
          {loading ? "Yadda saxlanılır..." : "Yadda Saxla"}
        </Button>
      </div>
    </form>
  )
}

