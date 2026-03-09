import { query, execute, getConnection } from "../config/db.js"
import { RowDataPacket } from "mysql2"
import type { Location } from "../types/index.js"

interface LocationRow extends RowDataPacket {
  id: string
  name: string
  building: string
  qr_url: string
  created_at: Date
  updated_at: Date
}

interface CounterRow extends RowDataPacket {
  name: string
  value: number
}

type NewLocation = Omit<Location, "created_at">

export async function getLocations(): Promise<Location[]> {
  const rows = await query<LocationRow[]>("SELECT * FROM locations ORDER BY name")
  return rows.map(mapLocationRow)
}

export async function getLocationById(id: string): Promise<Location | null> {
  const rows = await query<LocationRow[]>("SELECT * FROM locations WHERE id = ?", [id])
  if (rows.length === 0) return null
  return mapLocationRow(rows[0])
}

export async function createLocation(location: NewLocation): Promise<Location> {
  await execute(
    `INSERT INTO locations (id, name, building, qr_url)
     VALUES (?, ?, ?, ?)`,
    [location.id, location.name, location.building, location.qr_url]
  )
  const created = await getLocationById(location.id)
  if (!created) {
    throw new Error("Failed to fetch created location")
  }
  return created
}

export async function deleteLocation(id: string): Promise<boolean> {
  const result = await execute("DELETE FROM locations WHERE id = ?", [id])
  return result.affectedRows > 0
}

export async function generateLocationId(): Promise<string> {
  const connection = await getConnection()
  try {
    await connection.beginTransaction()

    await connection.execute(
      "UPDATE counters SET value = value + 1 WHERE name = 'location'"
    )

    const [rows] = await connection.query<CounterRow[]>(
      "SELECT value FROM counters WHERE name = 'location'"
    )

    await connection.commit()

    const counter = rows[0]?.value || 1
    return `loc-${String(counter).padStart(3, "0")}`
  } catch (error) {
    await connection.rollback()
    throw error
  } finally {
    connection.release()
  }
}

function mapLocationRow(row: LocationRow): Location {
  return {
    id: row.id,
    name: row.name,
    building: row.building,
    qr_url: row.qr_url,
    created_at: row.created_at.toISOString(),
  }
}
