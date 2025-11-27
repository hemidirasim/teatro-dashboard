import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  errorFormat: 'pretty',
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
})

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

// Helper function to test database connection with retry
export async function testDatabaseConnection(retries = 2): Promise<boolean> {
  for (let i = 0; i <= retries; i++) {
    try {
      // Try to reconnect if connection is closed
      try {
        await prisma.$connect()
      } catch (connectError) {
        // Connection might already be open, ignore
      }
      
      await prisma.$queryRawUnsafe('SELECT 1')
      return true
    } catch (error: any) {
      if (i === retries) {
        console.error('Database connection error after retries:', error.message)
        return false
      }
      
      // If connection is closed, try to reconnect
      if (error.message?.includes('closed') || error.code === 'P1001') {
        try {
          await prisma.$disconnect()
        } catch (disconnectError) {
          // Ignore disconnect errors
        }
        
        // Wait a bit before retrying
        await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)))
        continue
      }
      
      // For other errors, don't retry
      console.error('Database connection error:', error.message)
      return false
    }
  }
  return false
}



