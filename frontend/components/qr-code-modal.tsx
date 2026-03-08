"use client"

import { useRef } from "react"
import { QRCodeSVG } from "qrcode.react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Download } from "lucide-react"

interface QRCodeModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  locationName: string
  qrUrl: string
}

export function QRCodeModal({
  open,
  onOpenChange,
  locationName,
  qrUrl,
}: QRCodeModalProps) {
  const svgRef = useRef<HTMLDivElement>(null)

  function handleDownload() {
    const svg = svgRef.current?.querySelector("svg")
    if (!svg) return

    const canvas = document.createElement("canvas")
    canvas.width = 512
    canvas.height = 512
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const svgData = new XMLSerializer().serializeToString(svg)
    const img = new Image()
    img.crossOrigin = "anonymous"
    img.onload = () => {
      ctx.fillStyle = "#ffffff"
      ctx.fillRect(0, 0, 512, 512)
      ctx.drawImage(img, 0, 0, 512, 512)
      const link = document.createElement("a")
      link.download = `qr-${locationName}.png`
      link.href = canvas.toDataURL("image/png")
      link.click()
    }
    img.src = `data:image/svg+xml;base64,${btoa(svgData)}`
  }

  const fullUrl = typeof window !== "undefined"
    ? `${window.location.origin}${qrUrl}`
    : qrUrl

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>QR Code - {locationName}</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col items-center gap-4 py-4">
          <div ref={svgRef} className="rounded-lg border border-[#E5E7EB] p-4 bg-background">
            <QRCodeSVG value={fullUrl} size={200} />
          </div>
          <p className="text-sm text-muted-foreground break-all text-center">
            {fullUrl}
          </p>
          <Button onClick={handleDownload} variant="outline" className="gap-2">
            <Download className="h-4 w-4" />
            Download PNG
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
