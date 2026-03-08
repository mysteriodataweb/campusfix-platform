import crypto from "crypto"
import bcrypt from "bcryptjs"
import { execute } from "../config/db.js"

let reporterRoleReady = false

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase()
}

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

async function ensureReporterRoleSupport(): Promise<void> {
  if (reporterRoleReady) return

  await execute(`
    ALTER TABLE users
    MODIFY role ENUM('manager', 'superadmin', 'reporter') NOT NULL
  `)

  reporterRoleReady = true
}

export async function saveReporterEmailIfNew(rawEmail: string): Promise<void> {
  const email = normalizeEmail(rawEmail)
  await ensureReporterRoleSupport()

  const syntheticId = `rpt-${crypto.randomUUID().slice(0, 12)}`
  const lockedPassword = await bcrypt.hash(crypto.randomUUID(), 10)

  await execute(
    `INSERT INTO users (id, name, email, password_hash, role)
     VALUES (?, 'Reporter', ?, ?, 'reporter')
     ON DUPLICATE KEY UPDATE email = VALUES(email)`,
    [syntheticId, email, lockedPassword]
  )
}
