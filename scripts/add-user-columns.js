const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function addColumns() {
  try {
    console.log('Adding missing columns to User table...\n')

    // Check current structure
    const columns = await prisma.$queryRaw`
      SELECT COLUMN_NAME
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = 'teatrd_db1' 
      AND TABLE_NAME = 'User'
    `

    const columnNames = columns.map(c => c.COLUMN_NAME.toLowerCase())
    console.log('Current columns:', columnNames.join(', '))
    console.log('')

    // Add password column if missing
    if (!columnNames.includes('password')) {
      console.log('Adding password column...')
      await prisma.$executeRawUnsafe(`
        ALTER TABLE \`User\` 
        ADD COLUMN \`password\` VARCHAR(255) NOT NULL DEFAULT ''
      `)
      console.log('✅ Password column added')
    } else {
      console.log('✅ Password column already exists')
    }

    // Add name column if missing
    if (!columnNames.includes('name')) {
      console.log('Adding name column...')
      await prisma.$executeRawUnsafe(`
        ALTER TABLE \`User\` 
        ADD COLUMN \`name\` VARCHAR(255) NULL
      `)
      console.log('✅ Name column added')
    } else {
      console.log('✅ Name column already exists')
    }

    // Add role column if missing
    if (!columnNames.includes('role')) {
      console.log('Adding role column...')
      await prisma.$executeRawUnsafe(`
        ALTER TABLE \`User\` 
        ADD COLUMN \`role\` VARCHAR(50) NOT NULL DEFAULT 'admin'
      `)
      console.log('✅ Role column added')
    } else {
      console.log('✅ Role column already exists')
    }

    // Update Prisma schema mapping
    console.log('\n✅ All columns added successfully!')
    console.log('\nNote: You may need to run: npx prisma generate')

  } catch (error) {
    console.error('Error:', error.message)
    if (error.message.includes('Duplicate column')) {
      console.log('Column already exists, skipping...')
    }
  } finally {
    await prisma.$disconnect()
  }
}

addColumns()

