"use client"

import { useState } from "react"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "sonner"

export default function LoginPage() {
  const router = useRouter()
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      console.log("Attempting login for:", username, "Password length:", password.length)
      const result = await signIn("credentials", {
        username: username.trim(),
        password: password,
        redirect: false,
        callbackUrl: "/admin",
      })

      console.log("Login result:", result)

      if (result?.error) {
        console.error("Login error:", result.error)
        
        let errorMessage = "Invalid username or password"
        if (result.error.includes("Database connection")) {
          errorMessage = "Database connection error. Please try again later."
        } else if (result.error !== "CredentialsSignin") {
          errorMessage = result.error
        }
        
        toast.error(errorMessage)
      } else if (result?.ok) {
        toast.success("Login successful")
        router.push("/admin")
        router.refresh()
      } else {
        toast.error("Login failed. Please try again.")
      }
    } catch (error: any) {
      console.error("Login exception:", error)
      toast.error(error?.message || "An error occurred")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Login</CardTitle>
          <CardDescription>Enter your credentials to access the admin panel</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                type="text"
                placeholder="Enter your username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                autoComplete="username"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Signing in..." : "Sign In"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

