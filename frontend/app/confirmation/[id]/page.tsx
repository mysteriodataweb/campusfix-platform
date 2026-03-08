"use client"

import { useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Copy, ArrowRight, CheckCircle } from "lucide-react"

export default function ConfirmationPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [copied, setCopied] = useState(false)

  const trackingUrl = `${typeof window !== "undefined" ? window.location.origin : ""}/track/${id}`

  function handleCopy() {
    navigator.clipboard.writeText(trackingUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="mx-auto max-w-md text-center">
        {/* Checkmark SVG */}
        <div className="mb-6 flex justify-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-emerald-50">
            <CheckCircle className="h-10 w-10 text-emerald-600" />
          </div>
        </div>

        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Report Submitted
        </h1>

        <p className="mt-2 text-muted-foreground">
          Your ticket ID is{" "}
          <span className="font-mono font-semibold text-foreground">{id}</span>
        </p>

        {/* Tracking URL */}
        <div className="mt-6 rounded-lg border border-[#E5E7EB] bg-muted/30 p-4">
          <p className="mb-2 text-xs text-muted-foreground">
            Your tracking link
          </p>
          <p className="break-all font-mono text-sm text-foreground">
            {trackingUrl}
          </p>
        </div>

        <div className="mt-6 flex flex-col gap-3">
          <Button
            onClick={handleCopy}
            variant="outline"
            className="w-full gap-2"
          >
            <Copy className="h-4 w-4" />
            {copied ? "Copied" : "Copy Link"}
          </Button>

          <Button
            onClick={() => router.push(`/track/${id}`)}
            className="w-full gap-2 bg-[#111111] text-background hover:bg-[#111111]/90"
          >
            Track my report
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>

        <p className="mt-6 text-xs text-muted-foreground">
          If you provided an email, we have also sent this link to your inbox.
        </p>
      </div>
    </div>
  )
}
