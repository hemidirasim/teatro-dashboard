const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function checkTables() {
  try {
    console.log('Checking database tables...\n')

    // Get all tables
    const tables = await prisma.$queryRaw`
      SELECT TABLE_NAME 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_SCHEMA = 'teatrd_db1'
      ORDER BY TABLE_NAME
    `

    console.log(`Found ${tables.length} table(s):\n`)
    tables.forEach((table, i) => {
      console.log(`${i + 1}. ${table.TABLE_NAME}`)
    })

    // Check if User table exists
    const userTable = tables.find(t => 
      t.TABLE_NAME.toLowerCase() === 'user' || 
      t.TABLE_NAME.toLowerCase() === 'users'
    )

    if (userTable) {
      console.log(`\n✅ Found user table: ${userTable.TABLE_NAME}`)
      
      // Get table structure
      const columns = await prisma.$queryRaw`
        SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_KEY
        FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_SCHEMA = 'teatrd_db1' 
        AND TABLE_NAME = ${userTable.TABLE_NAME}
        ORDER BY ORDINAL_POSITION
      `

      console.log('\nTable structure:')
      columns.forEach(col => {
        console.log(`  - ${col.COLUMN_NAME} (${col.DATA_TYPE}) ${col.IS_NULLABLE === 'YES' ? 'NULL' : 'NOT NULL'} ${col.COLUMN_KEY ? `[${col.COLUMN_KEY}]` : ''}`)
      })

      // Get row count
      const count = await prisma.$queryRawUnsafe(
        `SELECT COUNT(*) as count FROM \`${userTable.TABLE_NAME}\``
      )
      console.log(`\nTotal rows: ${count[0]?.count || 0}`)

      // Get sample data
      if (count[0]?.count > 0) {
        const sample = await prisma.$queryRawUnsafe(
          `SELECT * FROM \`${userTable.TABLE_NAME}\` LIMIT 3`
        )
        console.log('\nSample data:')
        sample.forEach((row, i) => {
          console.log(`\nRow ${i + 1}:`)
          Object.keys(row).forEach(key => {
            const value = row[key]
            if (key.toLowerCase().includes('password')) {
              console.log(`  ${key}: ${value ? value.substring(0, 20) + '...' : 'NULL'} (length: ${value?.length || 0})`)
            } else {
              console.log(`  ${key}: ${value}`)
            }
          })
        })
      }
    } else {
      console.log('\n❌ User table not found!')
      console.log('Available tables:', tables.map(t => t.TABLE_NAME).join(', '))
    }

  } catch (error) {
    console.error('Error:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

checkTables()

