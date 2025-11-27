import { prisma } from "@/lib/prisma"
import { generateSlug } from "@/lib/slug-utils"
import { redirect } from "next/navigation"
import type { Metadata } from "next"

interface PageProps {
  params: Promise<{ id: string }>
}

export async function generateMetadata(
  props: PageProps
): Promise<Metadata> {
  const params = await props.params
  const postId = parseInt(params.id)

  try {
    const posts = await prisma.$queryRawUnsafe(`
      SELECT pc.title, pc.title_sub, pc.content
      FROM \`post\` p
      LEFT JOIN \`post_content\` pc ON p.id = pc.post_id AND pc.lang_id = 'az'
      WHERE p.id = ${postId} AND p.status = 1
      LIMIT 1
    `) as any[]

    if (posts.length === 0) {
      return {
        title: "Xəbər tapılmadı",
      }
    }

    const post = posts[0]
    const description = post.title_sub || (post.content ? post.content.replace(/<[^>]*>/g, '').substring(0, 160) : '')

    return {
      title: post.title || "Xəbər",
      description: description,
    }
  } catch {
    return {
      title: "Xəbər",
    }
  }
}

export default async function PostRedirectPage(props: PageProps) {
  const params = await props.params
  const postId = parseInt(params.id)

  try {
    const posts = await prisma.$queryRawUnsafe(`
      SELECT pc.title FROM \`post\` p
      LEFT JOIN \`post_content\` pc ON p.id = pc.post_id AND pc.lang_id = 'az'
      WHERE p.id = ${postId} AND p.status = 1
      LIMIT 1
    `) as any[]

    if (posts.length === 0) {
      redirect("/")
    }

    const post = posts[0]
    const slug = generateSlug(post.title) || `post-${postId}`
    redirect(`/az/post/${slug}-${postId}`)
  } catch (error) {
    redirect("/")
  }
}
