"use client"

import {
  Zap,
  Monitor,
  Wifi,
  Droplets,
  Armchair,
  HelpCircle,
} from "lucide-react"
import type { IssueType } from "@/lib/types"

const issueTypes: { type: IssueType; label: string; icon: React.ElementType }[] = [
  { type: "Electricity", label: "Electricity", icon: Zap },
  { type: "IT", label: "IT Equipment", icon: Monitor },
  { type: "Internet", label: "Internet", icon: Wifi },
  { type: "Plumbing", label: "Plumbing", icon: Droplets },
  { type: "Furniture", label: "Furniture", icon: Armchair },
  { type: "Other", label: "Other", icon: HelpCircle },
]

export function IssueTypeGrid({
  selected,
  onSelect,
}: {
  selected: IssueType | null
  onSelect: (type: IssueType) => void
}) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
      {issueTypes.map(({ type, label, icon: Icon }) => {
        const isSelected = selected === type
        return (
          <button
            key={type}
            type="button"
            onClick={() => onSelect(type)}
            className={`flex flex-col items-center gap-2 rounded-lg border p-4 transition-colors ${
              isSelected
                ? "border-[#2563EB] bg-blue-50 text-[#2563EB]"
                : "border-[#E5E7EB] bg-background text-foreground hover:border-[#2563EB]/40"
            }`}
          >
            <Icon className="h-6 w-6" />
            <span className="text-sm font-medium">{label}</span>
          </button>
        )
      })}
    </div>
  )
}
