import mysql, { Pool, PoolConnection, RowDataPacket, ResultSetHeader } from "mysql2/promise"
import dotenv from "dotenv"

dotenv.config()

// Type pour les paramètres de requête
type QueryParam = string | number | boolean | null | Date | Buffer

function parseDatabaseUrl(databaseUrl: string) {
  const url = new URL(databaseUrl)
  if (!url.protocol.startsWith("mysql")) {
    throw new Error("DATABASE_URL must use mysql:// protocol")
  }

  return {
    host: url.hostname,
    user: decodeURIComponent(url.username),
    password: decodeURIComponent(url.password),
    database: url.pathname.replace(/^\//, ""),
    port: url.port ? parseInt(url.port, 10) : 3306,
  }
}

function getDbConfig() {
  if (process.env.DATABASE_URL) {
    const fromUrl = parseDatabaseUrl(process.env.DATABASE_URL)
    return {
      ...fromUrl,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
    }
  }

  const host = process.env.DB_HOST || process.env.MYSQLHOST
  const user = process.env.DB_USER || process.env.MYSQLUSER
  const password = process.env.DB_PASSWORD || process.env.MYSQLPASSWORD || ""
  const database = process.env.DB_NAME || process.env.MYSQLDATABASE
  const portRaw = process.env.DB_PORT || process.env.MYSQLPORT || "3306"
  const port = parseInt(portRaw, 10)

  if (!host || !user || !database || Number.isNaN(port)) {
    throw new Error(
      "Missing DB config. Set DATABASE_URL or DB_HOST/DB_USER/DB_PASSWORD/DB_NAME/DB_PORT (Railway also supports MYSQLHOST/MYSQLUSER/MYSQLPASSWORD/MYSQLDATABASE/MYSQLPORT)."
    )
  }

  return {
    host,
    user,
    password,
    database,
    port,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
  }
}

// Pool de connexions singleton
let pool: Pool | null = null

export function getPool(): Pool {
  if (!pool) {
    pool = mysql.createPool(getDbConfig())
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
