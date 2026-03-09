"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function AdminLoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      })

      const contentType = res.headers.get("content-type") || ""
      const isJson = contentType.includes("application/json")
      const data = isJson ? await res.json() : null

      if (res.ok && data?.success && data.role === "superadmin") {
        router.push("/admin/panel")
      } else {
        setError(data?.error || "Invalid credentials")
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Network error")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#FAFAFA] px-4">
      <div className="w-full max-w-sm">
        <div className="rounded-lg border border-[#E5E7EB] bg-background p-8">
          {/* Header */}
          <div className="mb-8 text-center">
            <h1 className="text-xl font-semibold tracking-tight text-foreground">
              CampusFix
            </h1>

            {/* Admin illustration - circuit/gear pattern */}
            <div className="mt-4 flex justify-center">
              <svg
                width="80"
                height="80"
                viewBox="0 0 80 80"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="text-muted-foreground"
              >
                <circle cx="40" cy="40" r="18" stroke="currentColor" strokeWidth="1.5" fill="none" />
                <circle cx="40" cy="40" r="6" stroke="currentColor" strokeWidth="1.5" fill="none" />
                <line x1="40" y1="10" x2="40" y2="22" stroke="currentColor" strokeWidth="1.5" />
                <line x1="40" y1="58" x2="40" y2="70" stroke="currentColor" strokeWidth="1.5" />
                <line x1="10" y1="40" x2="22" y2="40" stroke="currentColor" strokeWidth="1.5" />
                <line x1="58" y1="40" x2="70" y2="40" stroke="currentColor" strokeWidth="1.5" />
                <line x1="18.8" y1="18.8" x2="27.3" y2="27.3" stroke="currentColor" strokeWidth="1.5" />
                <line x1="52.7" y1="52.7" x2="61.2" y2="61.2" stroke="currentColor" strokeWidth="1.5" />
                <line x1="18.8" y1="61.2" x2="27.3" y2="52.7" stroke="currentColor" strokeWidth="1.5" />
                <line x1="52.7" y1="27.3" x2="61.2" y2="18.8" stroke="currentColor" strokeWidth="1.5" />
                <circle cx="40" cy="10" r="3" stroke="currentColor" strokeWidth="1.2" fill="none" />
                <circle cx="40" cy="70" r="3" stroke="currentColor" strokeWidth="1.2" fill="none" />
                <circle cx="10" cy="40" r="3" stroke="currentColor" strokeWidth="1.2" fill="none" />
                <circle cx="70" cy="40" r="3" stroke="currentColor" strokeWidth="1.2" fill="none" />
              </svg>
            </div>

            <h2 className="mt-4 text-sm font-medium text-muted-foreground">
              System Administration
            </h2>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="admin@campusfix.dev"
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="Enter password"
              />
            </div>

            {error && (
              <p className="text-sm text-red-600">{error}</p>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-[#18181B] text-background hover:bg-[#18181B]/90 h-10"
            >
              {loading ? "Signing in..." : "Sign In"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}
