import { Router, Request, Response } from "express"
import { getUsersByRole, updateUser } from "../services/userService.js"
import { addLog } from "../services/logService.js"
import { authenticate, authorize } from "../middleware/auth.js"
import { createEmailVerificationToken } from "../services/emailVerificationService.js"
import { sendEmailVerification } from "../services/emailService.js"

const router = Router()

// GET /api/manager - Get manager info (superadmin only)
router.get(
  "/",
  authenticate,
  authorize("superadmin"),
  async (_req: Request, res: Response): Promise<void> => {
    try {
      const managers = await getUsersByRole("manager")
      const manager = managers[0]

      if (!manager) {
        res.status(404).json({ error: "Manager not found" })
        return
      }

      res.json({
        id: manager.id,
        name: manager.name,
        email: manager.email,
        createdAt: manager.createdAt,
      })
    } catch (error) {
      console.error("Get manager error:", error)
      res.status(500).json({ error: "Internal server error" })
    }
  }
)

// PATCH /api/manager - Update manager info (superadmin only)
router.patch(
  "/",
  authenticate,
  authorize("superadmin"),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const managers = await getUsersByRole("manager")
      const manager = managers[0]

      if (!manager) {
        res.status(404).json({ error: "Manager not found" })
        return
      }

      const { name, email } = req.body
      const normalizedEmail =
        typeof email === "string" ? email.trim().toLowerCase() : undefined
      const emailChanged =
        !!normalizedEmail && normalizedEmail !== manager.email.toLowerCase()

      await updateUser(manager.id, {
        name,
        email: emailChanged ? normalizedEmail : undefined,
      })

      if (emailChanged && normalizedEmail) {
        const token = await createEmailVerificationToken(manager.id)
        const backendUrl =
          process.env.BACKEND_URL || `http://localhost:${process.env.PORT || 5000}`
        const verificationUrl = `${backendUrl}/api/auth/verify-email?token=${token}`
        sendEmailVerification(manager.name, normalizedEmail, verificationUrl)
      }

      await addLog(`Manager account updated`, "Super Admin")

      // Récupérer le manager mis à jour
      const updatedManagers = await getUsersByRole("manager")
      const updatedManager = updatedManagers[0]

      res.json({
        success: true,
        manager: {
          id: updatedManager.id,
          name: updatedManager.name,
          email: updatedManager.email,
          createdAt: updatedManager.createdAt,
        },
      })
    } catch (error) {
      console.error("Update manager error:", error)
      res.status(500).json({ error: "Internal server error" })
    }
  }
)

export default router
