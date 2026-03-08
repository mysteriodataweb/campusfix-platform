import { Router, Request, Response } from "express"
import { getSystemLogs, addLog } from "../services/logService.js"
import { authenticate, authorize } from "../middleware/auth.js"

const router = Router()

// GET /api/logs - Get all system logs (superadmin only)
router.get(
  "/",
  authenticate,
  authorize("superadmin"),
  async (_req: Request, res: Response): Promise<void> => {
    try {
      const logs = await getSystemLogs()
      res.json(logs)
    } catch (error) {
      console.error("Get logs error:", error)
      res.status(500).json({ error: "Internal server error" })
    }
  }
)

export default router
