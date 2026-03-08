import { Router, Request, Response } from "express"
import { getUserByEmail } from "../services/userService.js"
import { addLog } from "../services/logService.js"
import { generateToken, checkPassword } from "../middleware/auth.js"
import { sendEmailVerification } from "../services/emailService.js"
import {
  createEmailVerificationToken,
  ensureEmailVerificationSchema,
  verifyEmailToken,
} from "../services/emailVerificationService.js"

const router = Router()

// POST /api/auth/login
router.post("/login", async (req: Request, res: Response): Promise<void> => {
  try {
    await ensureEmailVerificationSchema()

    const { email, password } = req.body
    const normalizedEmail = String(email || "")
      .trim()
      .toLowerCase()

    if (!normalizedEmail || !password) {
      res.status(400).json({ error: "Email and password are required" })
      return
    }

    const user = await getUserByEmail(normalizedEmail)
    if (!user) {
      res.status(401).json({ error: "Invalid credentials" })
      return
    }

    if (user.role === "reporter") {
      res.status(401).json({ error: "Invalid credentials" })
      return
    }

    if ((user.role === "manager" || user.role === "superadmin") && !user.emailVerified) {
      res.status(403).json({
        error: "Email not verified. Please verify your email before logging in.",
      })
      return
    }

    const valid = await checkPassword(password, normalizedEmail)
    if (!valid) {
      res.status(401).json({ error: "Invalid credentials" })
      return
    }

    const token = generateToken(user.id, user.role)
    await addLog(`${user.role} logged in`, user.name)

    // Set cookie
    res.cookie("session", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 8 * 60 * 60 * 1000, // 8 hours
      path: "/",
    })

    res.json({
      success: true,
      token,
      role: user.role,
      name: user.name,
    })
  } catch (error) {
    console.error("Login error:", error)
    res.status(500).json({ error: "Internal server error" })
  }
})

// POST /api/auth/request-email-verification
router.post(
  "/request-email-verification",
  async (req: Request, res: Response): Promise<void> => {
    try {
      await ensureEmailVerificationSchema()

      const email = String(req.body?.email || "").trim().toLowerCase()
      if (!email) {
        res.status(400).json({ error: "Email is required" })
        return
      }

      const user = await getUserByEmail(email)
      if (!user || (user.role !== "manager" && user.role !== "superadmin")) {
        // Avoid leaking user existence.
        res.json({ success: true })
        return
      }

      const token = await createEmailVerificationToken(user.id)
      const backendUrl =
        process.env.BACKEND_URL || `http://localhost:${process.env.PORT || 5000}`
      const verificationUrl = `${backendUrl}/api/auth/verify-email?token=${token}`

      sendEmailVerification(user.name, user.email, verificationUrl)
      res.json({ success: true })
    } catch (error) {
      console.error("Request email verification error:", error)
      res.status(500).json({ error: "Internal server error" })
    }
  }
)

// GET /api/auth/verify-email?token=...
router.get("/verify-email", async (req: Request, res: Response): Promise<void> => {
  try {
    await ensureEmailVerificationSchema()

    const token = String(req.query.token || "").trim()
    if (!token) {
      res.status(400).json({ error: "Token is required" })
      return
    }

    const ok = await verifyEmailToken(token)
    if (!ok) {
      res.status(400).json({ error: "Invalid or expired token" })
      return
    }

    res.json({ success: true, message: "Email verified successfully" })
  } catch (error) {
    console.error("Verify email error:", error)
    res.status(500).json({ error: "Internal server error" })
  }
})

// POST /api/auth/logout
router.post("/logout", (_req: Request, res: Response): void => {
  res.cookie("session", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 0,
    path: "/",
  })
  res.json({ success: true })
})

export default router
