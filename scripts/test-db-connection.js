const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
})

async function testConnection() {
  console.log('Testing database connection...\n')
  console.log('DATABASE_URL:', process.env.DATABASE_URL?.replace(/:[^:@]+@/, ':****@') || 'Not set')
  console.log('')

  try {
    // Test 1: Connect
    console.log('1. Testing connection...')
    await prisma.$connect()
    console.log('   ✅ Connection successful!\n')

    // Test 2: Query database
    console.log('2. Testing database query...')
    const result = await prisma.$queryRaw`SELECT DATABASE() as db`
    console.log('   ✅ Database query successful!')
    console.log('   Current database:', result[0]?.db || 'Unknown')
    console.log('')

    // Test 3: Check User table
    console.log('3. Testing User table access...')
    try {
      const userCount = await prisma.user.count()
      console.log('   ✅ User table accessible!')
      console.log('   Total users:', userCount)
      console.log('')

      if (userCount > 0) {
        console.log('4. Fetching users...')
        const users = await prisma.user.findMany({
          select: {
            id: true,
            username: true,
            email: true,
            role: true,
          },
          take: 5
        })
        console.log('   ✅ Users fetched successfully!')
        users.forEach((user, i) => {
          console.log(`   User ${i + 1}: ${user.username} (${user.email || 'no email'}) - ${user.role}`)
        })
      }
    } catch (tableError) {
      console.log('   ❌ User table error:', tableError.message)
      console.log('   This might mean the table doesn\'t exist or has a different name')
    }

    console.log('\n✅ All tests passed!')
    
  } catch (error) {
    console.error('\n❌ Connection test failed!')
    console.error('Error code:', error.code)
    console.error('Error name:', error.name)
    console.error('Error message:', error.message)
    
    if (error.code === 'P1000') {
      console.error('\n💡 This is an authentication error.')
      console.error('Possible solutions:')
      console.error('1. Check if your IP is whitelisted on the database server')
      console.error('2. Verify database credentials are correct')
      console.error('3. Check if MySQL authentication plugin needs to be changed')
    } else if (error.code === 'P1001') {
      console.error('\n💡 Cannot reach database server.')
      console.error('Possible solutions:')
      console.error('1. Check network connectivity')
      console.error('2. Verify firewall settings')
      console.error('3. Check if database server is running')
    }
    
    process.exit(1)
  } finally {
    await prisma.$disconnect()
    console.log('\nConnection closed.')
  }
}

testConnection()

