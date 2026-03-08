import type { Status } from "@/lib/types"
import { CheckCircle, Clock, Wrench } from "lucide-react"

const steps = [
  { key: "pending", label: "Submitted", icon: Clock },
  { key: "in_progress", label: "In Progress", icon: Wrench },
  { key: "resolved", label: "Resolved", icon: CheckCircle },
]

function getStepIndex(status: Status): number {
  if (status === "pending") return 0
  if (status === "in_progress") return 1
  return 2
}

export function StepperProgress({ status }: { status: Status }) {
  const currentIndex = getStepIndex(status)

  return (
    <>
      {/* Desktop horizontal */}
      <div className="hidden md:flex items-center gap-0 w-full">
        {steps.map((step, index) => {
          const isComplete = index <= currentIndex
          const Icon = step.icon
          return (
            <div key={step.key} className="flex items-center flex-1">
              <div className="flex flex-col items-center gap-2">
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-full border-2 transition-colors ${
                    isComplete
                      ? "border-[#2563EB] bg-[#2563EB] text-background"
                      : "border-[#E5E7EB] bg-background text-muted-foreground"
                  }`}
                >
                  <Icon className="h-5 w-5" />
                </div>
                <span
                  className={`text-sm font-medium ${
                    isComplete ? "text-foreground" : "text-muted-foreground"
                  }`}
                >
                  {step.label}
                </span>
              </div>
              {index < steps.length - 1 && (
                <div
                  className={`flex-1 h-0.5 mx-4 ${
                    index < currentIndex ? "bg-[#2563EB]" : "bg-[#E5E7EB]"
                  }`}
                />
              )}
            </div>
          )
        })}
      </div>

      {/* Mobile vertical */}
      <div className="flex md:hidden flex-col gap-0">
        {steps.map((step, index) => {
          const isComplete = index <= currentIndex
          const Icon = step.icon
          return (
            <div key={step.key} className="flex items-start gap-4">
              <div className="flex flex-col items-center">
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-full border-2 transition-colors ${
                    isComplete
                      ? "border-[#2563EB] bg-[#2563EB] text-background"
                      : "border-[#E5E7EB] bg-background text-muted-foreground"
                  }`}
                >
                  <Icon className="h-5 w-5" />
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={`w-0.5 h-8 ${
                      index < currentIndex ? "bg-[#2563EB]" : "bg-[#E5E7EB]"
                    }`}
                  />
                )}
              </div>
              <div className="pt-2">
                <span
                  className={`text-sm font-medium ${
                    isComplete ? "text-foreground" : "text-muted-foreground"
                  }`}
                >
                  {step.label}
                </span>
              </div>
            </div>
          )
        })}
      </div>
    </>
  )
}
