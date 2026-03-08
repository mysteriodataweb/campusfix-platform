"use client"

import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { QrCode, ClipboardList, Wrench, ArrowRight } from "lucide-react"

export default function HomePage() {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-[#E5E7EB]">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <h1 className="text-lg font-semibold tracking-tight text-foreground">
            CampusFix
          </h1>
        </div>
      </header>

      {/* Hero */}
      <main className="mx-auto max-w-5xl px-6">
        <section className="flex flex-col items-center py-20 text-center md:py-28">
          <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#2563EB]/10">
            <Wrench className="h-7 w-7 text-[#2563EB]" />
          </div>

          <h2 className="max-w-2xl text-balance text-3xl font-semibold tracking-tight text-foreground md:text-5xl">
            Smart Campus Maintenance Reporting
          </h2>

          <p className="mt-4 max-w-lg text-pretty text-muted-foreground leading-relaxed">
            Scan a QR code, report an issue, and track its resolution in
            real-time. Keeping your campus in perfect shape has never been
            easier.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button
              onClick={() => router.push("/report?location=A101")}
              className="gap-2 bg-[#111111] text-background hover:bg-[#111111]/90 h-11 px-6"
            >
              Try a Demo Report
              <ArrowRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              onClick={() => router.push("/track/RPT-001")}
              className="gap-2 h-11 px-6"
            >
              Track a Ticket
            </Button>
          </div>
        </section>

        {/* How it works */}
        <section className="border-t border-[#E5E7EB] py-16 md:py-20">
          <h3 className="mb-10 text-center text-lg font-semibold text-foreground">
            How It Works
          </h3>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: QrCode,
                title: "Scan QR Code",
                desc: "Each room has a unique QR code. Scan it with your phone to open the report form.",
              },
              {
                icon: ClipboardList,
                title: "Submit Report",
                desc: "Describe the issue, attach a photo, and submit. You will get a unique tracking link.",
              },
              {
                icon: Wrench,
                title: "Track Resolution",
                desc: "Follow your ticket through Submitted, In Progress, and Resolved stages in real-time.",
              },
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} className="flex flex-col items-center text-center">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl border border-[#E5E7EB] bg-background">
                  <Icon className="h-5 w-5 text-foreground" />
                </div>
                <h4 className="text-sm font-semibold text-foreground">{title}</h4>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                  {desc}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-[#E5E7EB] py-6 text-center">
          <p className="text-xs text-muted-foreground">
            CampusFix &mdash; Smart Campus QR Code Maintenance System
          </p>
        </footer>
      </main>
    </div>
  )
}
