import { Request, Response, NextFunction } from "express"
import jwt from "jsonwebtoken"
import bcrypt from "bcryptjs"
import { getUserById, getUserByEmail } from "../services/userService.js"
import type { Role, JwtPayload } from "../types/index.js"

const JWT_SECRET = process.env.JWT_SECRET || "campusfix-secret-key-change-in-production"

// Étendre l'interface Request pour inclure l'utilisateur
declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload
    }
  }
}

// Générer un token JWT
export function generateToken(userId: string, role: Role): string {
  return jwt.sign({ userId, role }, JWT_SECRET, { expiresIn: "8h" })
}

// Vérifier un token JWT
export function verifyToken(token: string): JwtPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JwtPayload
  } catch {
    return null
  }
}

// Middleware d'authentification
export function authenticate(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null

  // Aussi vérifier le cookie
  const cookieToken = req.cookies?.session

  const finalToken = token || cookieToken

  if (!finalToken) {
    res.status(401).json({ error: "Authentication required" })
    return
  }

  const payload = verifyToken(finalToken)
  if (!payload) {
    res.status(401).json({ error: "Invalid or expired token" })
    return
  }

  req.user = payload
  next()
}

// Middleware d'autorisation par rôle
export function authorize(...roles: Role[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: "Authentication required" })
      return
    }

    // superadmin a accès à tout
    if (req.user.role === "superadmin" || roles.includes(req.user.role)) {
      next()
      return
    }

    res.status(403).json({ error: "Forbidden" })
  }
}

// Vérification du mot de passe avec bcrypt
export async function checkPassword(inputPassword: string, email: string): Promise<boolean> {
  const user = await getUserByEmail(email)
  if (!user) return false

  return bcrypt.compare(inputPassword, user.passwordHash)
}

// Hasher un mot de passe
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10)
}
