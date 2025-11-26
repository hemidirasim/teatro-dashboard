import NextAuth, { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        try {
          console.log("Authorize called with:", {
            hasUsername: !!credentials?.username,
            hasPassword: !!credentials?.password,
            username: credentials?.username
          })

          if (!credentials?.username || !credentials?.password) {
            console.log("Missing credentials - username:", credentials?.username, "password:", !!credentials?.password)
            return null
          }

          console.log("Looking for user:", credentials.username)

          let user
          try {
            user = await prisma.user.findUnique({
              where: {
                username: credentials.username
              }
            })
            console.log("Database query completed. User found:", !!user)
          } catch (dbError: any) {
            console.error("Database query error:", dbError)
            if (dbError?.code === 'P1000' || dbError?.name === 'PrismaClientInitializationError') {
              throw new Error("Database connection failed. Please check your database credentials and network access.")
            }
            throw dbError
          }

          if (!user) {
            console.log("User not found:", credentials.username)
            // Let's also check if there are any users in the database
            try {
              const userCount = await prisma.user.count()
              console.log("Total users in database:", userCount)
            } catch (e) {
              console.error("Error counting users:", e)
            }
            return null
          }

          console.log("User found:", {
            id: user.id,
            username: user.username,
            passwordHashLength: user.password?.length || 0
          })

          console.log("Checking password...")
          const isPasswordValid = await bcrypt.compare(
            credentials.password,
            user.password
          )

          console.log("Password check result:", isPasswordValid)

          if (!isPasswordValid) {
            console.log("Invalid password for user:", credentials.username)
            // Check if password might be plain text (for debugging)
            if (user.password === credentials.password) {
              console.log("WARNING: Password appears to be stored in plain text!")
            }
            return null
          }

          console.log("Login successful for:", user.username)

          return {
            id: user.id.toString(),
            email: user.email || user.username,
            name: user.name || user.username,
            role: user.role,
          }
        } catch (error: any) {
          console.error("Auth error:", error)
          
          // Database connection error
          if (error?.code === 'P1000' || error?.name === 'PrismaClientInitializationError') {
            console.error("Database connection failed. Check DATABASE_URL and network access.")
            throw new Error("Database connection failed. Please contact administrator.")
          }
          
          // Other Prisma errors
          if (error?.code?.startsWith('P')) {
            console.error("Prisma error:", error.code, error.message)
          }
          
          return null
        }
      }
    })
  ],
  session: {
    strategy: "jwt"
  },
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = (user as any).role
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
        session.user.role = token.role as string
      }
      return session
    }
  }
}

const handler = NextAuth(authOptions)

export { handler as GET, handler as POST }

