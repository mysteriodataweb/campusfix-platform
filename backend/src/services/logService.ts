import { query, execute } from "../config/db.js"
import { RowDataPacket } from "mysql2"
import type { SystemLog } from "../types/index.js"

interface LogRow extends RowDataPacket {
  id: number
  timestamp: Date
  action: string
  actor: string
}

export async function getSystemLogs(): Promise<SystemLog[]> {
  const rows = await query<LogRow[]>(
    "SELECT * FROM system_logs ORDER BY timestamp DESC LIMIT 100"
  )
  return rows.map((row) => ({
    timestamp: row.timestamp.toISOString(),
    action: row.action,
    actor: row.actor,
  }))
}

export async function addLog(action: string, actor: string): Promise<void> {
  await execute("INSERT INTO system_logs (action, actor) VALUES (?, ?)", [
    action,
    actor,
  ])
}
