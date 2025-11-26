const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function checkUsers() {
  try {
    console.log('Checking users in database...\n')
    
    const users = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        email: true,
        name: true,
        role: true,
        password: true,
      }
    })

    console.log(`Found ${users.length} user(s):\n`)

    users.forEach((user, index) => {
      console.log(`User ${index + 1}:`)
      console.log(`  ID: ${user.id}`)
      console.log(`  Username: ${user.username}`)
      console.log(`  Email: ${user.email || 'Not set'}`)
      console.log(`  Name: ${user.name || 'Not set'}`)
      console.log(`  Role: ${user.role}`)
      console.log(`  Password hash length: ${user.password?.length || 0}`)
      console.log(`  Password hash starts with: ${user.password?.substring(0, 10) || 'N/A'}...`)
      console.log(`  Is bcrypt hash: ${user.password?.startsWith('$2') ? 'Yes' : 'No'}`)
      console.log('')
    })

    // Test password if provided
    if (process.argv[2] && process.argv[3]) {
      const testUsername = process.argv[2]
      const testPassword = process.argv[3]
      
      console.log(`\nTesting password for username: ${testUsername}`)
      const user = users.find(u => u.username === testUsername)
      
      if (!user) {
        console.log(`❌ User "${testUsername}" not found!`)
      } else {
        console.log(`✓ User found: ${user.username}`)
        const isValid = await bcrypt.compare(testPassword, user.password)
        console.log(`Password match: ${isValid ? '✅ YES' : '❌ NO'}`)
        
        if (!isValid && user.password === testPassword) {
          console.log('⚠️  WARNING: Password is stored in plain text!')
        }
      }
    }

  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkUsers()

