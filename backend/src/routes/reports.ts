import { Router, Request, Response } from "express"
import {
  getReports,
  getReportById,
  createReport,
  updateReportStatus,
  updateReportNotified,
  generateReportId,
} from "../services/reportService.js"
import { addLog } from "../services/logService.js"
import {
  sendReportConfirmation,
  sendNewReportNotification,
  sendTechnicianNotification,
} from "../services/emailService.js"
import {
  isValidEmail,
  normalizeEmail,
  saveReporterEmailIfNew,
} from "../services/reporterService.js"
import { authenticate, authorize } from "../middleware/auth.js"
import type { IssueType, Status, Report } from "../types/index.js"

const router = Router()

const validIssueTypes: IssueType[] = [
  "Electricity",
  "IT",
  "Internet",
  "Plumbing",
  "Furniture",
  "Other",
]

// GET /api/reports - Get all reports (manager/superadmin only)
router.get(
  "/",
  authenticate,
  authorize("manager", "superadmin"),
  async (_req: Request, res: Response): Promise<void> => {
    try {
      const reports = await getReports()
      res.json(reports)
    } catch (error) {
      console.error("Get reports error:", error)
      res.status(500).json({ error: "Internal server error" })
    }
  }
)

// GET /api/reports/:id - Get a single report (public for tracking)
router.get("/:id", async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params
    const report = await getReportById(id)

    if (!report) {
      res.status(404).json({ error: "Report not found" })
      return
    }

    res.json(report)
  } catch (error) {
    console.error("Get report error:", error)
    res.status(500).json({ error: "Internal server error" })
  }
})

// POST /api/reports - Create a new report (public)
router.post("/", async (req: Request, res: Response): Promise<void> => {
  try {
    const { location, issue_type, description, image_url, reporter_name, reporter_email } =
      req.body
    const normalizedReporterEmail = normalizeEmail(String(reporter_email || ""))
    const normalizedReporterName = String(reporter_name || "").trim()

    if (!location || !issue_type || !description || !normalizedReporterEmail) {
      res.status(400).json({
        error: "Location, issue type, description, and email are required",
      })
      return
    }

    if (!validIssueTypes.includes(issue_type)) {
      res.status(400).json({ error: "Invalid issue type" })
      return
    }

    if (!isValidEmail(normalizedReporterEmail)) {
      res.status(400).json({ error: "Invalid email address" })
      return
    }

    const id = await generateReportId()
    const report: Report = {
      id,
      location,
      issue_type,
      description,
      image_url: image_url || undefined,
      reporter_name: normalizedReporterName || undefined,
      reporter_email: normalizedReporterEmail,
      status: "pending",
      created_at: new Date().toISOString(),
      technician_notified: false,
    }

    await saveReporterEmailIfNew(normalizedReporterEmail)
    await createReport(report)
    await addLog(
      `New report submitted - ${id} - ${location}`,
      normalizedReporterName || "Anonymous"
    )

    const trackingUrl = `/track/${id}`
    sendReportConfirmation(report, trackingUrl)
    sendNewReportNotification(report, "manager@campus.com")

    res.json({ success: true, id, trackingUrl })
  } catch (error) {
    console.error("Create report error:", error)
    res.status(500).json({ error: "Internal server error" })
  }
})

// PATCH /api/reports/:id - Update report status (manager only)
router.patch(
  "/:id",
  authenticate,
  authorize("manager", "superadmin"),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params
      const { status } = req.body as { status: Status }

      const report = await getReportById(id)
      if (!report) {
        res.status(404).json({ error: "Report not found" })
        return
      }

      if (status && ["pending", "in_progress", "resolved"].includes(status)) {
        const updatedReport = await updateReportStatus(id, status)
        await addLog(
          `Status changed to ${status.replace("_", " ")} - ${id}`,
          "Manager"
        )
        res.json({ success: true, report: updatedReport })
        return
      }

      res.json({ success: true, report })
    } catch (error) {
      console.error("Update report error:", error)
      res.status(500).json({ error: "Internal server error" })
    }
  }
)

// POST /api/reports/:id/notify - Notify technician (manager only)
router.post(
  "/:id/notify",
  authenticate,
  authorize("manager", "superadmin"),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params
      const report = await getReportById(id)

      if (!report) {
        res.status(404).json({ error: "Report not found" })
        return
      }

      await updateReportNotified(id)
      sendTechnicianNotification(report, "technician@campus.com")
      await addLog(`Technician notified - ${id}`, "Manager")

      res.json({ success: true })
    } catch (error) {
      console.error("Notify error:", error)
      res.status(500).json({ error: "Internal server error" })
    }
  }
)

export default router
