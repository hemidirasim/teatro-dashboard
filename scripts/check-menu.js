const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function checkMenu() {
  try {
    console.log('Checking menu structure...\n')

    // Get menu items
    const menuItems = await prisma.$queryRawUnsafe(`
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
    `)

    console.log('Menu items:')
    menuItems.forEach((item, i) => {
      console.log(`${i + 1}. ID: ${item.id}, Parent: ${item.parent_id || 'none'}, Title: ${item.title || 'N/A'}, URL: ${item.special_url || 'N/A'}`)
    })

    // Get menu structure (hierarchical)
    const rootItems = menuItems.filter(item => !item.parent_id || item.parent_id === 0)
    console.log('\nRoot menu items:')
    rootItems.forEach(item => {
      console.log(`  - ${item.title || 'N/A'} (ID: ${item.id})`)
      const children = menuItems.filter(child => child.parent_id === item.id)
      if (children.length > 0) {
        children.forEach(child => {
          console.log(`    └─ ${child.title || 'N/A'} (ID: ${child.id})`)
        })
      }
    })

  } catch (error) {
    console.error('Error:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

checkMenu()

