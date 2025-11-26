"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { RichTextEditor } from "@/components/rich-text-editor"
import { toast } from "sonner"
import axios from "axios"
import { useRouter } from "next/navigation"
import { useState } from "react"

interface TableFormProps {
  tableName: string
  columns: Array<{
    COLUMN_NAME: string
    DATA_TYPE: string
    IS_NULLABLE: string
    COLUMN_KEY: string
    COLUMN_DEFAULT?: string | null
  }>
  initialData?: any
}

export function TableForm({ tableName, columns, initialData }: TableFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  // Create Zod schema dynamically
  const schemaFields: Record<string, z.ZodTypeAny> = {}
  columns.forEach((col) => {
    if (col.COLUMN_KEY === "PRI" && initialData) {
      // Primary key is required for updates but not for creates
      schemaFields[col.COLUMN_NAME] = z.any()
    } else {
      let fieldSchema: z.ZodTypeAny = z.string()
      
      if (col.DATA_TYPE.includes("int")) {
        fieldSchema = z.coerce.number()
      } else if (col.DATA_TYPE.includes("decimal") || col.DATA_TYPE.includes("float")) {
        fieldSchema = z.coerce.number()
      } else if (col.DATA_TYPE.includes("date") || col.DATA_TYPE.includes("time")) {
        fieldSchema = z.string()
      } else if (col.DATA_TYPE.includes("text")) {
        fieldSchema = z.string()
      }

      if (col.IS_NULLABLE === "YES") {
        fieldSchema = fieldSchema.optional().nullable()
      }

      schemaFields[col.COLUMN_NAME] = fieldSchema
    }
  })

  const schema = z.object(schemaFields)
  type FormData = z.infer<typeof schema>

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: initialData || {},
  })

  const onSubmit = async (data: FormData) => {
    setLoading(true)
    try {
      if (initialData) {
        // Update existing record
        const primaryKey = columns.find((c) => c.COLUMN_KEY === "PRI")?.COLUMN_NAME || "id"
        await axios.put(`/api/tables/${tableName}/${initialData[primaryKey]}`, data)
        toast.success("Record updated successfully")
      } else {
        // Create new record
        await axios.post(`/api/tables/${tableName}`, data)
        toast.success("Record created successfully")
      }
      router.push(`/admin/tables/${tableName}`)
      router.refresh()
    } catch (error: any) {
      toast.error(error.response?.data?.error || "An error occurred")
    } finally {
      setLoading(false)
    }
  }

  const getInputType = (dataType: string): string => {
    if (dataType.includes("int")) return "number"
    if (dataType.includes("decimal") || dataType.includes("float")) return "number"
    if (dataType.includes("date")) return "date"
    if (dataType.includes("time")) return "datetime-local"
    if (dataType.includes("text")) return "textarea"
    return "text"
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {columns.map((col) => {
        if (col.COLUMN_KEY === "PRI" && !initialData) {
          // Skip primary key for new records (auto-increment)
          return null
        }

        const inputType = getInputType(col.DATA_TYPE)
        const isRequired = col.IS_NULLABLE === "NO" && !col.COLUMN_DEFAULT

        if (inputType === "textarea") {
          // Use rich text editor for long text fields (TEXT, LONGTEXT, MEDIUMTEXT)
          const useRichText = col.DATA_TYPE.includes("text") && 
            (col.DATA_TYPE.includes("long") || col.DATA_TYPE.includes("medium") || col.COLUMN_NAME.toLowerCase().includes("content") || col.COLUMN_NAME.toLowerCase().includes("description"))
          
          if (useRichText) {
            return (
              <div key={col.COLUMN_NAME} className="space-y-2">
                <Label htmlFor={col.COLUMN_NAME}>
                  {col.COLUMN_NAME}
                  {isRequired && <span className="text-destructive">*</span>}
                </Label>
                <RichTextEditor
                  value={watch(col.COLUMN_NAME) || ""}
                  onChange={(value) => setValue(col.COLUMN_NAME, value)}
                  placeholder={`Enter ${col.COLUMN_NAME}`}
                />
                {errors[col.COLUMN_NAME] && (
                  <p className="text-sm text-destructive">
                    {errors[col.COLUMN_NAME]?.message as string}
                  </p>
                )}
              </div>
            )
          }
          
          return (
            <div key={col.COLUMN_NAME} className="space-y-2">
              <Label htmlFor={col.COLUMN_NAME}>
                {col.COLUMN_NAME}
                {isRequired && <span className="text-destructive">*</span>}
              </Label>
              <Textarea
                id={col.COLUMN_NAME}
                {...register(col.COLUMN_NAME)}
                disabled={col.COLUMN_KEY === "PRI" && !!initialData}
              />
              {errors[col.COLUMN_NAME] && (
                <p className="text-sm text-destructive">
                  {errors[col.COLUMN_NAME]?.message as string}
                </p>
              )}
            </div>
          )
        }

        return (
          <div key={col.COLUMN_NAME} className="space-y-2">
            <Label htmlFor={col.COLUMN_NAME}>
              {col.COLUMN_NAME}
              {isRequired && <span className="text-destructive">*</span>}
            </Label>
            <Input
              id={col.COLUMN_NAME}
              type={inputType}
              {...register(col.COLUMN_NAME)}
              disabled={col.COLUMN_KEY === "PRI" && !!initialData}
            />
            {errors[col.COLUMN_NAME] && (
              <p className="text-sm text-destructive">
                {errors[col.COLUMN_NAME]?.message as string}
              </p>
            )}
          </div>
        )
      })}

      <div className="flex gap-4">
        <Button type="submit" disabled={loading}>
          {loading ? "Saving..." : initialData ? "Update" : "Create"}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
        >
          Cancel
        </Button>
      </div>
    </form>
  )
}

