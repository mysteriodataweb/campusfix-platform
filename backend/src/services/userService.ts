import { query, execute } from "../config/db.js"
import { RowDataPacket } from "mysql2"
import type { User, Role } from "../types/index.js"

interface UserRow extends RowDataPacket {
  id: string
  name: string
  email: string
  password_hash: string
  role: Role
  created_at: Date
  updated_at: Date
  email_verified?: number | boolean
  email_verified_at?: Date | null
}

export async function getUsers(): Promise<User[]> {
  const rows = await query<UserRow[]>("SELECT * FROM users")
  return rows.map(mapUserRow)
}

export async function getUserById(id: string): Promise<User | null> {
  const rows = await query<UserRow[]>("SELECT * FROM users WHERE id = ?", [id])
  if (rows.length === 0) return null
  return mapUserRow(rows[0])
}

export async function getUserByEmail(email: string): Promise<User | null> {
  const rows = await query<UserRow[]>("SELECT * FROM users WHERE email = ?", [email])
  if (rows.length === 0) return null
  return mapUserRow(rows[0])
}

export async function getUsersByRole(role: Role): Promise<User[]> {
  const rows = await query<UserRow[]>("SELECT * FROM users WHERE role = ?", [role])
  return rows.map(mapUserRow)
}

export async function updateUser(
  id: string,
  data: { name?: string; email?: string }
): Promise<boolean> {
  const updates: string[] = []
  const values: (string | number)[] = []

  if (data.name) {
    updates.push("name = ?")
    values.push(data.name)
  }
  if (data.email) {
    updates.push("email = ?")
    updates.push("email_verified = FALSE")
    updates.push("email_verified_at = NULL")
    values.push(data.email)
  }

  if (updates.length === 0) return false

  values.push(id)
  const result = await execute(
    `UPDATE users SET ${updates.join(", ")} WHERE id = ?`,
    values
  )
  return result.affectedRows > 0
}

function mapUserRow(row: UserRow): User {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    passwordHash: row.password_hash,
    role: row.role,
    createdAt: row.created_at.toISOString(),
    emailVerified: Boolean(row.email_verified),
    emailVerifiedAt: row.email_verified_at?.toISOString(),
  }
}
