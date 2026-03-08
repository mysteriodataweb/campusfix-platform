import type { LucideIcon } from "lucide-react"

interface StatCardProps {
  title: string
  value: number
  icon: LucideIcon
  accentColor?: string
}

export function StatCard({ title, value, icon: Icon, accentColor }: StatCardProps) {
  return (
    <div className="flex items-center gap-4 rounded-lg border border-[#E5E7EB] bg-background p-5">
      <div
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg"
        style={{
          backgroundColor: accentColor ? `${accentColor}15` : "#f4f4f5",
          color: accentColor || "#18181B",
        }}
      >
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <p className="text-sm text-muted-foreground">{title}</p>
        <p className="text-2xl font-semibold text-foreground">{value}</p>
      </div>
    </div>
  )
}
