"use client"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Trash2, Edit } from "lucide-react"
import Link from "next/link"
import { useState } from "react"
import { toast } from "sonner"
import axios from "axios"
import { useRouter } from "next/navigation"

interface AuthorActionsProps {
  authorId: number
}

export function AuthorActions({ authorId }: AuthorActionsProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleDelete = async () => {
    setLoading(true)
    try {
      await axios.delete(`/api/authors/${authorId}`)
      toast.success("Müəllif silindi")
      router.refresh()
      setOpen(false)
    } catch (error) {
      toast.error("Müəllif silinərkən xəta baş verdi")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex items-center gap-2">
      <Link href={`/admin/authors/${authorId}/edit`}>
        <Button variant="ghost" size="icon">
          <Edit className="h-4 w-4" />
        </Button>
      </Link>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button variant="ghost" size="icon">
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Müəllifi Sil</DialogTitle>
            <DialogDescription>
              Bu müəllifi silmək istədiyinizə əminsiniz? Bu əməliyyat geri qaytarıla bilməz.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Ləğv et
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={loading}>
              {loading ? "Silinir..." : "Sil"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

