import express from "express"
import cors from "cors"
import cookieParser from "cookie-parser"
import dotenv from "dotenv"

// Load environment variables
if (!process.env.RAILWAY_PROJECT_ID && !process.env.RAILWAY_ENVIRONMENT) {
  dotenv.config()
}

// Import routes
import authRoutes from "./routes/auth.js"
import reportsRoutes from "./routes/reports.js"
import locationsRoutes from "./routes/locations.js"
import logsRoutes from "./routes/logs.js"
import managerRoutes from "./routes/manager.js"

// Import database
import { testConnection } from "./config/db.js"

const app = express()
const PORT = process.env.PORT || 5000
const FRONTEND_URL = process.env.FRONTEND_URL || "https://fix-px1j.vercel.app"
const ALLOWED_ORIGINS = FRONTEND_URL.split(",")
  .map((origin) => origin.trim())
  .filter(Boolean)
  .map((origin) => origin.replace(/\/$/, ""))

function isAllowedOrigin(origin?: string): boolean {
  if (!origin) return true

  const normalizedOrigin = origin.replace(/\/$/, "")
  if (ALLOWED_ORIGINS.includes(normalizedOrigin)) return true

  // Allow Vercel preview domains when configured with base vercel domain.
  if (normalizedOrigin.endsWith(".vercel.app")) return true

  return false
}

// Middleware
app.use(
  cors({
    origin(origin, callback) {
      if (isAllowedOrigin(origin)) {
        callback(null, true)
        return
      }
      console.warn(`[CORS] Rejected origin: ${origin || "-"}`)
      callback(new Error("Not allowed by CORS"))
    },
    credentials: true,
  })
)
app.use(express.json({ limit: "2mb" }))
app.use(express.urlencoded({ extended: true, limit: "2mb" }))
app.use(cookieParser())
app.use((req, res, next) => {
  const start = Date.now()
  res.on("finish", () => {
    const durationMs = Date.now() - start
    const origin = req.headers.origin || "-"
    console.log(
      `[HTTP] ${req.method} ${req.originalUrl} ${res.statusCode} origin=${origin} ${durationMs}ms`
    )
  })
  next()
})

// Routes
app.use("/api/auth", authRoutes)
app.use("/api/reports", reportsRoutes)
app.use("/api/report", reportsRoutes) // Alias for compatibility
app.use("/api/locations", locationsRoutes)
app.use("/api/logs", logsRoutes)
app.use("/api/manager", managerRoutes)

// Health check
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() })
})

// 404 handler
app.use((_req, res) => {
  res.status(404).json({ error: "Route not found" })
})

// Error handler
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error("Server error:", err)
  res.status(500).json({ error: "Internal server error" })
})

// Start server
async function start() {
  // Test database connection
  const dbConnected = await testConnection()
  if (!dbConnected) {
    console.error(" Impossible de se connecter à la base de données")
    console.log("Vérifiez vos paramètres dans le fichier .env")
    process.exit(1)
  }

  app.listen(PORT, () => {
    console.log(`
╔════════════════════════════════════════════════════════════╗
║                 🚀 SmartCampus Backend                      ║
╠════════════════════════════════════════════════════════════╣
║  Server:    http://localhost:${PORT}                          ║
║  API Base:  http://localhost:${PORT}/api                      ║
║  Frontend:  ${FRONTEND_URL}                       ║
╠════════════════════════════════════════════════════════════╣
║  Endpoints:                                                 ║
║    POST   /api/auth/login     - Login                       ║
║    POST   /api/auth/logout    - Logout                      ║
║    GET    /api/reports        - Get all reports             ║
║    POST   /api/reports        - Create report               ║
║    GET    /api/reports/:id    - Get report by ID            ║
║    PATCH  /api/reports/:id    - Update report               ║
║    POST   /api/reports/:id/notify - Notify technician       ║
║    GET    /api/locations      - Get all locations           ║
║    POST   /api/locations      - Create location             ║
║    DELETE /api/locations/:id  - Delete location             ║
║    GET    /api/logs           - Get system logs             ║
║    GET    /api/manager        - Get manager info            ║
║    PATCH  /api/manager        - Update manager              ║
╚════════════════════════════════════════════════════════════╝
    `)
  })
}

start()
