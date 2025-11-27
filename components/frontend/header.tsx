import { prisma } from "@/lib/prisma"
import { HeaderClient } from "./header-client"

export async function Header() {
  let menuItems: any[] = []

  try {
    const menuData = await prisma.$queryRawUnsafe(`
      SELECT 
        m.id,
        m.parent_id,
        m.special_url,
        m.sort_order,
        m.status,
        mc.title,
        mc.lang_id
      FROM \`menu\` m
      LEFT JOIN \`menu_content\` mc ON m.id = mc.menu_id AND mc.lang_id = 'az'
      WHERE m.status = 1
      ORDER BY m.sort_order, m.id
    `) as any[]

    // Build hierarchical structure
    const menuMap = new Map()
    const rootItems: any[] = []

    // First pass: create all menu items
    menuData.forEach((item: any) => {
      const menuItem = {
        id: Number(item.id),
        parentId: item.parent_id ? Number(item.parent_id) : null,
        title: item.title || 'Menu',
        url: item.special_url || '#',
        sortOrder: Number(item.sort_order),
        children: []
      }
      menuMap.set(menuItem.id, menuItem)
    })

    // Second pass: build hierarchy
    menuData.forEach((item: any) => {
      const menuItem = menuMap.get(Number(item.id))
      if (menuItem.parentId) {
        const parent = menuMap.get(menuItem.parentId)
        if (parent) {
          parent.children.push(menuItem)
        } else {
          rootItems.push(menuItem)
        }
      } else {
        rootItems.push(menuItem)
      }
    })

    // Sort children
    const sortMenu = (items: any[]) => {
      items.sort((a, b) => a.sortOrder - b.sortOrder)
      items.forEach(item => {
        if (item.children.length > 0) {
          sortMenu(item.children)
        }
      })
    }
    sortMenu(rootItems)

    menuItems = rootItems
  } catch (error) {
    console.error("Error fetching menu:", error)
    // Fallback to default menu
    menuItems = [
      { id: 1, title: "Ana Səhifə", url: "/", children: [] },
      { id: 2, title: "Xəbərlər", url: "/xeberler", children: [] },
      { id: 3, title: "Müəlliflər", url: "/muellifler", children: [] },
    ]
  }

  return <HeaderClient menuItems={menuItems} />
}

