"use client"

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { StatusBadge } from "@/components/status-badge"
import { MapPin, Tag, CalendarDays, User, Mail, Bell } from "lucide-react"
import type { Report } from "@/lib/types"
import { format } from "date-fns"
import { toast } from "sonner"

interface ReportDrawerProps {
  report: Report | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onStatusChange: (id: string, status: "in_progress" | "resolved") => void
  onNotify: (id: string) => void
}

export function ReportDrawer({
  report,
  open,
  onOpenChange,
  onStatusChange,
  onNotify,
}: ReportDrawerProps) {
  if (!report) return null

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="overflow-y-auto sm:max-w-md">
        <SheetHeader>
          <SheetTitle className="font-mono">{report.id}</SheetTitle>
          <SheetDescription>Manage this report</SheetDescription>
        </SheetHeader>

        <div className="flex flex-col gap-6 px-4 pb-4">
          {/* Status */}
          <div>
            <p className="mb-1 text-xs text-muted-foreground">Status</p>
            <StatusBadge status={report.status} />
          </div>

          {/* Details */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <MapPin className="h-4 w-4 shrink-0 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Location</p>
                <p className="text-sm font-medium text-foreground">{report.location}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Tag className="h-4 w-4 shrink-0 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Issue Type</p>
                <p className="text-sm font-medium text-foreground">{report.issue_type}</p>
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
            {report.reporter_name && (
              <div className="flex items-center gap-3">
                <User className="h-4 w-4 shrink-0 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Reporter</p>
                  <p className="text-sm font-medium text-foreground">{report.reporter_name}</p>
                </div>
              </div>
            )}
            {report.reporter_email && (
              <div className="flex items-center gap-3">
                <Mail className="h-4 w-4 shrink-0 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Email</p>
                  <p className="text-sm font-medium text-foreground">{report.reporter_email}</p>
                </div>
              </div>
            )}
          </div>

          {/* Description */}
          <div>
            <p className="mb-1 text-xs text-muted-foreground">Description</p>
            <p className="text-sm text-foreground leading-relaxed">{report.description}</p>
          </div>

          {/* Photo */}
          {report.image_url && (
            <div>
              <p className="mb-1 text-xs text-muted-foreground">Photo</p>
              <img
                src={report.image_url}
                alt="Issue photo"
                className="w-full rounded-lg border border-[#E5E7EB] object-cover"
              />
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-col gap-2 pt-2">
            {report.status === "pending" && (
              <Button
                onClick={() => {
                  onStatusChange(report.id, "in_progress")
                  toast.success("Status updated to In Progress")
                }}
                className="w-full bg-[#2563EB] text-background hover:bg-[#2563EB]/90"
              >
                Mark as In Progress
              </Button>
            )}
            {report.status === "in_progress" && (
              <Button
                onClick={() => {
                  onStatusChange(report.id, "resolved")
                  toast.success("Status updated to Resolved")
                }}
                className="w-full bg-emerald-600 text-background hover:bg-emerald-600/90"
              >
                Mark as Resolved
              </Button>
            )}
            {!report.technician_notified && (
              <Button
                onClick={() => {
                  onNotify(report.id)
                  toast.success("Technician notified")
                }}
                variant="outline"
                className="w-full gap-2"
              >
                <Bell className="h-4 w-4" />
                Notify Technician
              </Button>
            )}
            {report.technician_notified && (
              <p className="text-center text-xs text-muted-foreground">
                Technician has been notified
              </p>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
