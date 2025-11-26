import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { AdminLayout } from "@/components/admin-layout"

export default async function AdminLayoutWrapper({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect("/login")
  }

  return <AdminLayout>{children}</AdminLayout>
}



