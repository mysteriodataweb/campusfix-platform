import bcrypt from "bcryptjs"
import mysql from "mysql2/promise"
import dotenv from "dotenv"

if (!process.env.RAILWAY_PROJECT_ID && !process.env.RAILWAY_ENVIRONMENT) {
  dotenv.config()
}

function getSeedDbConfig() {
  const databaseUrl = process.env.DATABASE_URL || process.env.MYSQL_URL
  if (databaseUrl) {
    const url = new URL(databaseUrl)
    if (!url.protocol.startsWith("mysql")) {
      throw new Error("DATABASE_URL/MYSQL_URL must use mysql:// protocol")
    }

    return {
      host: url.hostname,
      user: decodeURIComponent(url.username),
      password: decodeURIComponent(url.password),
      port: url.port ? parseInt(url.port, 10) : 3306,
      databaseName: url.pathname.replace(/^\//, "") || "campusfixit",
      multipleStatements: true,
    }
  }

  const host = process.env.DB_HOST || process.env.MYSQLHOST
  const user = process.env.DB_USER || process.env.MYSQLUSER
  const password = process.env.DB_PASSWORD || process.env.MYSQLPASSWORD || ""
  const portRaw = process.env.DB_PORT || process.env.MYSQLPORT || "3306"
  const port = parseInt(portRaw, 10)
  const database = process.env.DB_NAME || process.env.MYSQLDATABASE || "campusfixit"

  if (!host || !user || Number.isNaN(port)) {
    throw new Error(
      "Missing DB config for seed. Set DB_HOST/DB_USER/DB_PASSWORD/DB_PORT or MYSQLHOST/MYSQLUSER/MYSQLPASSWORD/MYSQLPORT."
    )
  }

  return {
    host,
    user,
    password,
    port,
    databaseName: database,
    multipleStatements: true,
  }
}

function quoteIdentifier(name: string): string {
  return `\`${name.replace(/`/g, "``")}\``
}

async function seed() {
  console.log("ðŸš€ Initialisation de la base de donnÃ©es CampusFixIT...")

  // GÃ©nÃ©rer les hash de mots de passe
  const managerPassword = await bcrypt.hash("manager123", 10)
  const adminPassword = await bcrypt.hash("admin123", 10)

  console.log("ðŸ“ Hash manager:", managerPassword)
  console.log("ðŸ“ Hash admin:", adminPassword)

  let connection

  try {
    // Connexion sans base de donnÃ©es pour pouvoir la crÃ©er
    const seedConfig = getSeedDbConfig()
    const { databaseName, ...connectionConfig } = seedConfig
    connection = await mysql.createConnection(connectionConfig)
    console.log("âœ… Connexion Ã©tablie")

    // CrÃ©er la base de donnÃ©es
    const quotedDbName = quoteIdentifier(databaseName)

    await connection.query(`
      CREATE DATABASE IF NOT EXISTS ${quotedDbName}
      CHARACTER SET utf8mb4
      COLLATE utf8mb4_unicode_ci
    `)
    console.log("âœ… Base de donnÃ©es crÃ©Ã©e")

    // Utiliser la base de donnÃ©es
    await connection.query(`USE ${quotedDbName}`)

    // CrÃ©er les tables
    await connection.query(`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(50) PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(100) NOT NULL UNIQUE,
        password_hash VARCHAR(255) NOT NULL,
        role ENUM('manager', 'superadmin', 'reporter') NOT NULL,
        email_verified BOOLEAN NOT NULL DEFAULT FALSE,
        email_verified_at TIMESTAMP NULL DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_email (email),
        INDEX idx_role (role)
      ) ENGINE=InnoDB
    `)
    console.log("âœ… Table users crÃ©Ã©e")

    // Migration safety when users table already exists with older schema
    await connection.query(`
      ALTER TABLE users
      MODIFY role ENUM('manager', 'superadmin', 'reporter') NOT NULL
    `)
    try {
      await connection.query(`
        ALTER TABLE users
        ADD COLUMN email_verified BOOLEAN NOT NULL DEFAULT FALSE
      `)
    } catch (error) {
      const code = (error as { code?: string }).code
      if (code !== "ER_DUP_FIELDNAME") {
        throw error
      }
    }

    try {
      await connection.query(`
        ALTER TABLE users
        ADD COLUMN email_verified_at TIMESTAMP NULL DEFAULT NULL
      `)
    } catch (error) {
      const code = (error as { code?: string }).code
      if (code !== "ER_DUP_FIELDNAME") {
        throw error
      }
    }

    await connection.query(`
      CREATE TABLE IF NOT EXISTS locations (
        id VARCHAR(50) PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        building VARCHAR(100) NOT NULL,
        qr_url VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_name (name),
        INDEX idx_building (building)
      ) ENGINE=InnoDB
    `)
    console.log("âœ… Table locations crÃ©Ã©e")

    await connection.query(`
      CREATE TABLE IF NOT EXISTS reports (
        id INT AUTO_INCREMENT PRIMARY KEY,
        location VARCHAR(100) NOT NULL,
        issue_type ENUM('Electricity', 'IT', 'Internet', 'Plumbing', 'Furniture', 'Other') NOT NULL,
        description TEXT NOT NULL,
        image_url VARCHAR(500) DEFAULT NULL,
        reporter_name VARCHAR(100) DEFAULT NULL,
        reporter_email VARCHAR(100) DEFAULT NULL,
        status ENUM('pending', 'in_progress', 'resolved') NOT NULL DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        resolved_at TIMESTAMP NULL DEFAULT NULL,
        technician_notified BOOLEAN DEFAULT FALSE,
        INDEX idx_status (status),
        INDEX idx_issue_type (issue_type),
        INDEX idx_location (location),
        INDEX idx_created_at (created_at DESC)
      ) ENGINE=InnoDB
    `)
    console.log("âœ… Table reports crÃ©Ã©e")

    await connection.query(`
      CREATE TABLE IF NOT EXISTS system_logs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        action VARCHAR(500) NOT NULL,
        actor VARCHAR(100) NOT NULL,
        INDEX idx_timestamp (timestamp DESC),
        INDEX idx_actor (actor)
      ) ENGINE=InnoDB
    `)
    console.log("âœ… Table system_logs crÃ©Ã©e")

    await connection.query(`
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
    console.log("Table email_verification_tokens created")

    await connection.query(`
      CREATE TABLE IF NOT EXISTS counters (
        name VARCHAR(50) PRIMARY KEY,
        value INT NOT NULL DEFAULT 0
      ) ENGINE=InnoDB
    `)
    console.log("âœ… Table counters crÃ©Ã©e")

    // InsÃ©rer les utilisateurs
    await connection.query(`
      CREATE TABLE IF NOT EXISTS reporter_emails (
        email VARCHAR(100) PRIMARY KEY,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_created_at (created_at DESC)
      ) ENGINE=InnoDB
    `)
    console.log("Table reporter_emails created")

    await connection.query(
      `INSERT INTO users (id, name, email, password_hash, role, email_verified, email_verified_at) VALUES
       (?, ?, ?, ?, ?, ?, ?),
       (?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         password_hash = VALUES(password_hash),
         email_verified = VALUES(email_verified),
         email_verified_at = VALUES(email_verified_at)`,
      [
        "mgr-001",
        "Campus Manager",
        "manager@campus.com",
        managerPassword,
        "manager",
        true,
        new Date(),
        "admin-001",
        "Super Admin",
        "admin@campusfix.dev",
        adminPassword,
        "superadmin",
        true,
        new Date(),
      ]
    )
    console.log("âœ… Utilisateurs crÃ©Ã©s")

    // InsÃ©rer les emplacements
    await connection.query(
      `INSERT INTO locations (id, name, building, qr_url) VALUES
       ('loc-001', 'A101', 'Block A', '/report?location=A101'),
       ('loc-002', 'Labo-Info-3', 'Tech Block', '/report?location=Labo-Info-3'),
       ('loc-003', 'Bibliotheque', 'Central', '/report?location=Bibliotheque')
       ON DUPLICATE KEY UPDATE name = VALUES(name)`
    )
    console.log("âœ… Emplacements crÃ©Ã©s")

    // InsÃ©rer les signalements de test
    await connection.query(
      `INSERT INTO reports (location, issue_type, description, reporter_name, reporter_email, status, technician_notified, created_at) VALUES
       ('A101', 'Electricity', 'Ceiling light flickering since this morning, affecting visibility during class.', 'Amadou Diallo', 'amadou@campus.com', 'pending', FALSE, NOW()),
       ('Labo-Info-3', 'Internet', 'No internet connection on any computer in the lab.', NULL, NULL, 'in_progress', TRUE, DATE_SUB(NOW(), INTERVAL 1 DAY)),
       ('Bibliotheque', 'Furniture', 'Broken chair near the window reading section.', NULL, NULL, 'resolved', TRUE, DATE_SUB(NOW(), INTERVAL 2 DAY))`
    )
    console.log("âœ… Signalements de test crÃ©Ã©s")

    // Initialiser les compteurs
    await connection.query(
      `INSERT INTO counters (name, value) VALUES
       ('location', 3)
       ON DUPLICATE KEY UPDATE value = VALUES(value)`
    )
    console.log("âœ… Compteurs initialisÃ©s")

    await connection.query(
      `INSERT IGNORE INTO reporter_emails (email) VALUES
       ('amadou@campus.com')`
    )
    console.log("âœ… Emails utilisateurs initialisÃ©s")

    console.log("\nðŸŽ‰ Base de donnÃ©es initialisÃ©e avec succÃ¨s!")
    console.log("\nðŸ“‹ Comptes crÃ©Ã©s:")
    console.log("   Manager: manager@campus.com / manager123")
    console.log("   Admin: admin@campusfix.dev / admin123")
  } catch (error) {
    console.error("âŒ Erreur:", error)
    process.exit(1)
  } finally {
    if (connection) {
      await connection.end()
    }
  }
}

seed()
