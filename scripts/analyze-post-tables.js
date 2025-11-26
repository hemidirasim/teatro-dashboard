const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function analyzePostTables() {
  try {
    console.log('Analyzing post-related tables...\n')

    // Check post table
    const postColumns = await prisma.$queryRaw`
      SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_KEY, COLUMN_DEFAULT
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = 'teatrd_db1' 
      AND TABLE_NAME = 'post'
      ORDER BY ORDINAL_POSITION
    `

    console.log('=== POST TABLE ===')
    console.log(`Columns: ${postColumns.length}\n`)
    postColumns.forEach(col => {
      console.log(`  ${col.COLUMN_NAME}: ${col.DATA_TYPE} ${col.IS_NULLABLE === 'YES' ? 'NULL' : 'NOT NULL'} ${col.COLUMN_KEY ? `[${col.COLUMN_KEY}]` : ''} ${col.COLUMN_DEFAULT ? `DEFAULT: ${col.COLUMN_DEFAULT}` : ''}`)
    })

    // Check post_content table
    const postContentColumns = await prisma.$queryRaw`
      SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_KEY, COLUMN_DEFAULT
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = 'teatrd_db1' 
      AND TABLE_NAME = 'post_content'
      ORDER BY ORDINAL_POSITION
    `

    console.log('\n=== POST_CONTENT TABLE ===')
    console.log(`Columns: ${postContentColumns.length}\n`)
    postContentColumns.forEach(col => {
      console.log(`  ${col.COLUMN_NAME}: ${col.DATA_TYPE} ${col.IS_NULLABLE === 'YES' ? 'NULL' : 'NOT NULL'} ${col.COLUMN_KEY ? `[${col.COLUMN_KEY}]` : ''} ${col.COLUMN_DEFAULT ? `DEFAULT: ${col.COLUMN_DEFAULT}` : ''}`)
    })

    // Check category table
    const categoryColumns = await prisma.$queryRaw`
      SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_KEY
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = 'teatrd_db1' 
      AND TABLE_NAME = 'category'
      ORDER BY ORDINAL_POSITION
    `

    console.log('\n=== CATEGORY TABLE ===')
    console.log(`Columns: ${categoryColumns.length}\n`)
    categoryColumns.forEach(col => {
      console.log(`  ${col.COLUMN_NAME}: ${col.DATA_TYPE} ${col.IS_NULLABLE === 'YES' ? 'NULL' : 'NOT NULL'} ${col.COLUMN_KEY ? `[${col.COLUMN_KEY}]` : ''}`)
    })

    // Check xref_post_category table
    const xrefColumns = await prisma.$queryRaw`
      SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_KEY
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = 'teatrd_db1' 
      AND TABLE_NAME = 'xref_post_category'
      ORDER BY ORDINAL_POSITION
    `

    console.log('\n=== XREF_POST_CATEGORY TABLE ===')
    console.log(`Columns: ${xrefColumns.length}\n`)
    xrefColumns.forEach(col => {
      console.log(`  ${col.COLUMN_NAME}: ${col.DATA_TYPE} ${col.IS_NULLABLE === 'YES' ? 'NULL' : 'NOT NULL'} ${col.COLUMN_KEY ? `[${col.COLUMN_KEY}]` : ''}`)
    })

    // Get sample data
    const postCount = await prisma.$queryRawUnsafe(`SELECT COUNT(*) as count FROM \`post\``)
    console.log(`\n=== SAMPLE DATA ===`)
    console.log(`Total posts: ${postCount[0]?.count || 0}`)

    if (postCount[0]?.count > 0) {
      const sample = await prisma.$queryRawUnsafe(`SELECT * FROM \`post\` LIMIT 1`)
      if (sample.length > 0) {
        console.log('\nSample post:')
        Object.keys(sample[0]).forEach(key => {
          console.log(`  ${key}: ${sample[0][key]}`)
        })
      }
    }

  } catch (error) {
    console.error('Error:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

analyzePostTables()

