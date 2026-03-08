import mysql, { Pool, PoolConnection, RowDataPacket, ResultSetHeader } from "mysql2/promise"
import dotenv from "dotenv"

dotenv.config()

// Type pour les paramètres de requête
type QueryParam = string | number | boolean | null | Date | Buffer

// Configuration de la base de données
const dbConfig = {
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "campusfixit",
  port: parseInt(process.env.DB_PORT || "3306"),
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
}

// Pool de connexions singleton
let pool: Pool | null = null

export function getPool(): Pool {
  if (!pool) {
    pool = mysql.createPool(dbConfig)
  }
  return pool
}

// Helper pour exécuter des requêtes SELECT
export async function query<T extends RowDataPacket[]>(
  sql: string,
  params?: QueryParam[]
): Promise<T> {
  const pool = getPool()
  const [rows] = await pool.query<T>(sql, params)
  return rows
}

// Helper pour exécuter des requêtes d'insertion/update/delete
export async function execute(
  sql: string,
  params?: QueryParam[]
): Promise<ResultSetHeader> {
  const pool = getPool()
  const [result] = await pool.query<ResultSetHeader>(sql, params)
  return result
}

// Helper pour obtenir une connexion (pour les transactions)
export async function getConnection(): Promise<PoolConnection> {
  const pool = getPool()
  return pool.getConnection()
}

// Test de connexion
export async function testConnection(): Promise<boolean> {
  try {
    const pool = getPool()
    const connection = await pool.getConnection()
    await connection.ping()
    connection.release()
    console.log("✅ Connexion à la base de données réussie")
    return true
  } catch (error) {
    console.error("❌ Erreur de  la connexion à la base de données:", error)
    return false
  }
}

// Fermer le pool de connexions
export async function closePool(): Promise<void> {
  if (pool) {
    await pool.end()
    pool = null
  }
}
