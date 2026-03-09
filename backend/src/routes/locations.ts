import { Router, Request, Response } from "express"
import {
  getLocations,
  getLocationById,
  createLocation,
  deleteLocation,
  generateLocationId,
} from "../services/locationService.js"
import { addLog } from "../services/logService.js"
import { authenticate, authorize } from "../middleware/auth.js"

const router = Router()

// GET /api/locations - Get all locations (manager/superadmin only)
router.get(
  "/",
  authenticate,
  authorize("manager", "superadmin"),
  async (_req: Request, res: Response): Promise<void> => {
    try {
      const locations = await getLocations()
      res.json(locations)
    } catch (error) {
      console.error("Get locations error:", error)
      res.status(500).json({ error: "Internal server error" })
    }
  }
)

// POST /api/locations - Create a new location (superadmin only)
router.post(
  "/",
  authenticate,
  authorize("superadmin"),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { name, building } = req.body

      if (!name || !building) {
        res.status(400).json({ error: "Name and building are required" })
        return
      }

      const id = await generateLocationId()
      const location = {
        id,
        name,
        building,
        qr_url: `/report?location=${encodeURIComponent(name)}`,
      }

      const createdLocation = await createLocation(location)
      await addLog(`Location added - ${name} (${building})`, "Super Admin")

      res.json({ success: true, location: createdLocation })
    } catch (error) {
      console.error("Create location error:", error)
      res.status(500).json({ error: "Internal server error" })
    }
  }
)

// DELETE /api/locations/:id - Delete a location (superadmin only)
router.delete(
  "/:id",
  authenticate,
  authorize("superadmin"),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params
      const location = await getLocationById(id)

      if (!location) {
        res.status(404).json({ error: "Location not found" })
        return
      }

      await deleteLocation(id)
      await addLog(`Location deleted - ${location.name}`, "Super Admin")

      res.json({ success: true })
    } catch (error) {
      console.error("Delete location error:", error)
      res.status(500).json({ error: "Internal server error" })
    }
  }
)

export default router
