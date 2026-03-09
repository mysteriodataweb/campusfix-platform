"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function ManagerLoginPage() {
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

      if (res.ok && data?.success && data.role === "manager") {
        router.push("/dashboard")
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
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm">
        <div className="rounded-lg border border-[#E5E7EB] bg-background p-8">
          {/* Header */}
          <div className="mb-8 text-center">
            <h1 className="text-xl font-semibold tracking-tight text-foreground">
              CampusFix
            </h1>

            {/* Building illustration */}
            <div className="mt-4 flex justify-center">
              <svg
                width="80"
                height="80"
                viewBox="0 0 80 80"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="text-muted-foreground"
              >
                <rect x="15" y="20" width="50" height="45" rx="2" stroke="currentColor" strokeWidth="1.5" fill="none" />
                <rect x="25" y="28" width="8" height="8" rx="1" stroke="currentColor" strokeWidth="1.2" fill="none" />
                <rect x="36" y="28" width="8" height="8" rx="1" stroke="currentColor" strokeWidth="1.2" fill="none" />
                <rect x="47" y="28" width="8" height="8" rx="1" stroke="currentColor" strokeWidth="1.2" fill="none" />
                <rect x="25" y="40" width="8" height="8" rx="1" stroke="currentColor" strokeWidth="1.2" fill="none" />
                <rect x="36" y="40" width="8" height="8" rx="1" stroke="currentColor" strokeWidth="1.2" fill="none" />
                <rect x="47" y="40" width="8" height="8" rx="1" stroke="currentColor" strokeWidth="1.2" fill="none" />
                <rect x="33" y="52" width="14" height="13" rx="1" stroke="currentColor" strokeWidth="1.2" fill="none" />
                <line x1="10" y1="65" x2="70" y2="65" stroke="currentColor" strokeWidth="1.5" />
              </svg>
            </div>

            <h2 className="mt-4 text-sm font-medium text-muted-foreground">
              Manager Access
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
                placeholder="manager@campus.com"
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
              className="w-full bg-[#111111] text-background hover:bg-[#111111]/90 h-10"
            >
              {loading ? "Signing in..." : "Sign In"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}
