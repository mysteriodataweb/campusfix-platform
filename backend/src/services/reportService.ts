import { query, execute, getConnection } from "../config/db.js"
import { RowDataPacket } from "mysql2"
import type { Report, IssueType, Status } from "../types/index.js"

interface ReportRow extends RowDataPacket {
  id: string
  location: string
  issue_type: IssueType
  description: string
  image_url: string | null
  reporter_name: string | null
  reporter_email: string | null
  status: Status
  created_at: Date
  updated_at: Date
  resolved_at: Date | null
  technician_notified: boolean
}

interface CounterRow extends RowDataPacket {
  name: string
  value: number
}

export async function getReports(): Promise<Report[]> {
  const rows = await query<ReportRow[]>(
    "SELECT * FROM reports ORDER BY created_at DESC"
  )
  return rows.map(mapReportRow)
}

export async function getReportById(id: string): Promise<Report | null> {
  const rows = await query<ReportRow[]>("SELECT * FROM reports WHERE id = ?", [id])
  if (rows.length === 0) return null
  return mapReportRow(rows[0])
}

export async function createReport(report: Omit<Report, "updated_at">): Promise<Report> {
  await execute(
    `INSERT INTO reports (id, location, issue_type, description, image_url, reporter_name, reporter_email, status, technician_notified)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      report.id,
      report.location,
      report.issue_type,
      report.description,
      report.image_url || null,
      report.reporter_name || null,
      report.reporter_email || null,
      report.status,
      report.technician_notified,
    ]
  )
  return report as Report
}

export async function updateReportStatus(
  id: string,
  status: Status
): Promise<Report | null> {
  const resolvedAt = status === "resolved" ? new Date().toISOString() : null

  await execute(
    `UPDATE reports SET status = ?, resolved_at = ? WHERE id = ?`,
    [status, resolvedAt, id]
  )

  return getReportById(id)
}

export async function updateReportNotified(id: string): Promise<boolean> {
  const result = await execute(
    "UPDATE reports SET technician_notified = TRUE WHERE id = ?",
    [id]
  )
  return result.affectedRows > 0
}

export async function generateReportId(): Promise<string> {
  const connection = await getConnection()
  try {
    await connection.beginTransaction()

    await connection.execute(
      "UPDATE counters SET value = value + 1 WHERE name = 'report'"
    )

    const [rows] = await connection.query<CounterRow[]>(
      "SELECT value FROM counters WHERE name = 'report'"
    )

    await connection.commit()

    const counter = rows[0]?.value || 1
    return `RPT-${String(counter).padStart(3, "0")}`
  } catch (error) {
    await connection.rollback()
    throw error
  } finally {
    connection.release()
  }
}

function mapReportRow(row: ReportRow): Report {
  return {
    id: row.id,
    location: row.location,
    issue_type: row.issue_type,
    description: row.description,
    image_url: row.image_url || undefined,
    reporter_name: row.reporter_name || undefined,
    reporter_email: row.reporter_email || undefined,
    status: row.status,
    created_at: row.created_at.toISOString(),
    updated_at: row.updated_at?.toISOString(),
    resolved_at: row.resolved_at?.toISOString(),
    technician_notified: Boolean(row.technician_notified),
  }
}
