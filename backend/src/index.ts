import express from "express"
import cors from "cors"
import cookieParser from "cookie-parser"
import dotenv from "dotenv"

// Load environment variables
dotenv.config()

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

// Middleware
app.use(
  cors({
    origin: FRONTEND_URL,
    credentials: true,
  })
)
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(cookieParser())

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
    console.error("❌ Impossible de se connecter à la base de données")
    console.log("💡 Vérifiez vos paramètres dans le fichier .env")
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
