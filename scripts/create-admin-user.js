const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function createAdminUser() {
  const username = process.argv[2] || 'admin'
  const password = process.argv[3] || 'admin123'
  const name = process.argv[4] || 'Admin User'
  const email = process.argv[5] || null

  try {
    const hashedPassword = await bcrypt.hash(password, 10)

    const user = await prisma.user.create({
      data: {
        username,
        email: email || null,
        password: hashedPassword,
        name,
        role: 'admin',
      },
    })

    console.log('Admin user created successfully!')
    console.log('Username:', user.username)
    console.log('Email:', user.email || 'Not set')
    console.log('ID:', user.id)
  } catch (error) {
    if (error.code === 'P2002') {
      console.error('User with this username already exists')
    } else {
      console.error('Error creating user:', error)
    }
  } finally {
    await prisma.$disconnect()
  }
}

createAdminUser()

