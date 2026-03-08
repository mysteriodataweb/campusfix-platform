"use client"

import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { MapPin, Upload, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { IssueTypeGrid } from "@/components/issue-type-card"
import type { IssueType } from "@/lib/types"
import { Suspense } from "react"

function ReportFormContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const location = searchParams.get("location") || ""

  const [issueType, setIssueType] = useState<IssueType | null>(null)
  const [description, setDescription] = useState("")
  const [reporterName, setReporterName] = useState("")
  const [reporterEmail, setReporterEmail] = useState("")
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!issueType || !description || !location || !reporterEmail.trim()) return

    setLoading(true)
    try {
      const res = await fetch("/api/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          location,
          issue_type: issueType,
          description,
          image_url: imagePreview || undefined,
          reporter_name: reporterName.trim() || undefined,
          reporter_email: reporterEmail.trim(),
        }),
      })

      const data = await res.json()
      if (data.success) {
        router.push(`/confirmation/${data.id}`)
      }
    } catch {
      // handle error
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-lg px-4 py-8">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-xl font-semibold tracking-tight text-foreground">
            CampusFix
          </h1>
          {location && (
            <div className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-[#E5E7EB] bg-background px-3 py-1">
              <MapPin className="h-3.5 w-3.5 text-[#2563EB]" />
              <span className="text-sm font-medium text-foreground">
                {location}
              </span>
            </div>
          )}
        </div>

        {/* Illustration */}
        <div className="mb-6 flex justify-center">
          <svg
            width="120"
            height="120"
            viewBox="0 0 120 120"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="text-[#2563EB]"
          >
            <circle cx="60" cy="60" r="56" stroke="currentColor" strokeWidth="1.5" opacity="0.15" />
            <circle cx="60" cy="60" r="40" stroke="currentColor" strokeWidth="1.5" opacity="0.25" />
            <path
              d="M50 45L55 40H65L70 45V55L65 75H55L50 55V45Z"
              stroke="currentColor"
              strokeWidth="1.5"
              fill="none"
            />
            <path
              d="M55 75V82H65V75"
              stroke="currentColor"
              strokeWidth="1.5"
              fill="none"
            />
            <path
              d="M53 82H67"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
            <circle cx="60" cy="52" r="3" stroke="currentColor" strokeWidth="1.5" />
          </svg>
        </div>

        <p className="mb-8 text-center text-sm text-muted-foreground">
          Report a maintenance issue in this room
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          {/* Location (read-only) */}
          <div className="flex flex-col gap-2">
            <Label>Location</Label>
            <div className="flex items-center gap-2 rounded-md border border-[#E5E7EB] bg-muted/50 px-3 py-2.5">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                {location || "No location specified"}
              </span>
            </div>
          </div>

          {/* Issue Type */}
          <div className="flex flex-col gap-2">
            <Label>Issue Type</Label>
            <IssueTypeGrid selected={issueType} onSelect={setIssueType} />
          </div>

          {/* Description */}
          <div className="flex flex-col gap-2">
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              placeholder="Describe the issue in detail..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              rows={4}
              className="resize-none"
            />
          </div>

          {/* Photo Upload */}
          <div className="flex flex-col gap-2">
            <Label>Photo (optional)</Label>
            {imagePreview ? (
              <div className="relative rounded-lg border border-[#E5E7EB] overflow-hidden">
                <img
                  src={imagePreview}
                  alt="Issue preview"
                  className="h-48 w-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => setImagePreview(null)}
                  className="absolute top-2 right-2 flex h-7 w-7 items-center justify-center rounded-full bg-foreground/80 text-background hover:bg-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <label className="flex cursor-pointer flex-col items-center gap-2 rounded-lg border-2 border-dashed border-[#E5E7EB] p-8 transition-colors hover:border-[#2563EB]/40">
                <Upload className="h-6 w-6 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  Click or drag to upload a photo
                </span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                />
              </label>
            )}
          </div>

          {/* Name */}
          <div className="flex flex-col gap-2">
            <Label htmlFor="name">Your Name (optional)</Label>
            <Input
              id="name"
              placeholder="Leave blank to stay anonymous"
              value={reporterName}
              onChange={(e) => setReporterName(e.target.value)}
            />
          </div>

          {/* Email */}
          <div className="flex flex-col gap-2">
            <Label htmlFor="email">Your Email *</Label>
            <Input
              id="email"
              type="email"
              placeholder="Required to submit and receive tracking link"
              value={reporterEmail}
              onChange={(e) => setReporterEmail(e.target.value)}
              required
            />
          </div>

          {/* Submit */}
          <Button
            type="submit"
            disabled={!issueType || !description || !location || !reporterEmail.trim() || loading}
            className="w-full bg-[#111111] text-background hover:bg-[#111111]/90 h-12 text-base font-medium"
          >
            {loading ? "Submitting..." : "Submit Report"}
          </Button>
        </form>
      </div>
    </div>
  )
}

export default function ReportPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-foreground border-t-transparent" />
        </div>
      }
    >
      <ReportFormContent />
    </Suspense>
  )
}
