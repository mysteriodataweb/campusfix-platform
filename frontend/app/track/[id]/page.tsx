"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { MapPin, Tag, CalendarDays, Clock } from "lucide-react"
import { StepperProgress } from "@/components/stepper-progress"
import type { Report } from "@/lib/types"
import { formatDistanceToNow, format } from "date-fns"

export default function TrackPage() {
  const { id } = useParams<{ id: string }>()
  const [report, setReport] = useState<Report | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    async function fetchReport() {
      try {
        const res = await fetch(`/api/report/${id}`)
        if (!res.ok) {
          setError(true)
          return
        }
        const data = await res.json()
        setReport(data)
      } catch {
        setError(true)
      } finally {
        setLoading(false)
      }
    }
    fetchReport()
  }, [id])

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-foreground border-t-transparent" />
      </div>
    )
  }

  if (error || !report) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="text-center">
          <h1 className="text-xl font-semibold text-foreground">
            Report Not Found
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            The ticket ID you provided could not be found in our system.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-lg px-4 py-8">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-xl font-semibold tracking-tight text-foreground">
            CampusFix
          </h1>
        </div>

        {/* Ticket ID */}
        <div className="mb-8 text-center">
          <p className="text-sm text-muted-foreground">Ticket</p>
          <p className="mt-1 font-mono text-2xl font-semibold text-foreground">
            {report.id}
          </p>
        </div>

        {/* Details */}
        <div className="mb-8 rounded-lg border border-[#E5E7EB] p-5">
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <MapPin className="h-4 w-4 shrink-0 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Location</p>
                <p className="text-sm font-medium text-foreground">
                  {report.location}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Tag className="h-4 w-4 shrink-0 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Issue Type</p>
                <p className="text-sm font-medium text-foreground">
                  {report.issue_type}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <CalendarDays className="h-4 w-4 shrink-0 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Submitted</p>
                <p className="text-sm font-medium text-foreground">
                  {format(new Date(report.created_at), "MMM d, yyyy 'at' h:mm a")}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Progress Stepper */}
        <div className="mb-8">
          <h2 className="mb-4 text-sm font-medium text-foreground">
            Progress
          </h2>
          <StepperProgress status={report.status} />
        </div>

        {/* Status message */}
        <div className="rounded-lg border border-[#E5E7EB] bg-muted/30 p-4 text-center">
          {report.status === "pending" && (
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              A technician will be assigned soon
            </div>
          )}
          {report.status === "in_progress" && (
            <p className="text-sm text-muted-foreground">
              A technician is working on this issue
            </p>
          )}
          {report.status === "resolved" && report.resolved_at && (
            <p className="text-sm text-muted-foreground">
              Resolved{" "}
              {formatDistanceToNow(new Date(report.resolved_at), {
                addSuffix: true,
              })}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
