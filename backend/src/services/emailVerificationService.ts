import crypto from "crypto"
import { RowDataPacket } from "mysql2"
import { execute, query } from "../config/db.js"

interface VerificationTokenRow extends RowDataPacket {
  user_id: string
}

let emailVerificationSchemaReady = false

export async function ensureEmailVerificationSchema(): Promise<void> {
  if (emailVerificationSchemaReady) return

  await execute(`
    ALTER TABLE users
    ADD COLUMN IF NOT EXISTS email_verified BOOLEAN NOT NULL DEFAULT FALSE
  `)

  await execute(`
    ALTER TABLE users
    ADD COLUMN IF NOT EXISTS email_verified_at TIMESTAMP NULL DEFAULT NULL
  `)

  await execute(`
    CREATE TABLE IF NOT EXISTS email_verification_tokens (
      token_hash VARCHAR(64) PRIMARY KEY,
      user_id VARCHAR(50) NOT NULL,
      expires_at TIMESTAMP NOT NULL,
      used_at TIMESTAMP NULL DEFAULT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_user_id (user_id),
      INDEX idx_expires_at (expires_at)
    ) ENGINE=InnoDB
  `)

  // Keep existing admin/manager logins working after migration.
  await execute(`
    UPDATE users
    SET email_verified = TRUE,
        email_verified_at = COALESCE(email_verified_at, NOW())
    WHERE role IN ('manager', 'superadmin')
      AND email_verified = FALSE
  `)

  emailVerificationSchemaReady = true
}

export async function createEmailVerificationToken(userId: string): Promise<string> {
  await ensureEmailVerificationSchema()

  const rawToken = crypto.randomBytes(32).toString("hex")
  const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex")

  await execute(
    `INSERT INTO email_verification_tokens (token_hash, user_id, expires_at)
     VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 24 HOUR))
     ON DUPLICATE KEY UPDATE
       user_id = VALUES(user_id),
       expires_at = VALUES(expires_at),
       used_at = NULL`,
    [tokenHash, userId]
  )

  return rawToken
}

export async function verifyEmailToken(rawToken: string): Promise<boolean> {
  await ensureEmailVerificationSchema()

  const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex")
  const rows = await query<VerificationTokenRow[]>(
    `SELECT user_id
     FROM email_verification_tokens
     WHERE token_hash = ?
       AND used_at IS NULL
       AND expires_at > NOW()`,
    [tokenHash]
  )

  if (rows.length === 0) return false

  const userId = rows[0].user_id
  await execute(
    `UPDATE email_verification_tokens
     SET used_at = NOW()
     WHERE token_hash = ?`,
    [tokenHash]
  )

  await execute(
    `UPDATE users
     SET email_verified = TRUE,
         email_verified_at = NOW()
     WHERE id = ?`,
    [userId]
  )

  return true
}
