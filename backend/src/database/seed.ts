import bcrypt from "bcryptjs"
import mysql from "mysql2/promise"
import dotenv from "dotenv"

dotenv.config()

const dbConfig = {
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  port: parseInt(process.env.DB_PORT || "3306"),
  multipleStatements: true,
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
    connection = await mysql.createConnection(dbConfig)
    console.log("âœ… Connexion Ã©tablie")

    // CrÃ©er la base de donnÃ©es
    await connection.query(`
      CREATE DATABASE IF NOT EXISTS campusfixit
      CHARACTER SET utf8mb4
      COLLATE utf8mb4_unicode_ci
    `)
    console.log("âœ… Base de donnÃ©es crÃ©Ã©e")

    // Utiliser la base de donnÃ©es
    await connection.query("USE campusfixit")

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
    await connection.query(`
      ALTER TABLE users
      ADD COLUMN IF NOT EXISTS email_verified BOOLEAN NOT NULL DEFAULT FALSE
    `)
    await connection.query(`
      ALTER TABLE users
      ADD COLUMN IF NOT EXISTS email_verified_at TIMESTAMP NULL DEFAULT NULL
    `)

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
        id VARCHAR(50) PRIMARY KEY,
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
      `INSERT INTO reports (id, location, issue_type, description, reporter_name, reporter_email, status, technician_notified, created_at) VALUES
       ('RPT-001', 'A101', 'Electricity', 'Ceiling light flickering since this morning, affecting visibility during class.', 'Amadou Diallo', 'amadou@campus.com', 'pending', FALSE, NOW()),
       ('RPT-002', 'Labo-Info-3', 'Internet', 'No internet connection on any computer in the lab.', NULL, NULL, 'in_progress', TRUE, DATE_SUB(NOW(), INTERVAL 1 DAY)),
       ('RPT-003', 'Bibliotheque', 'Furniture', 'Broken chair near the window reading section.', NULL, NULL, 'resolved', TRUE, DATE_SUB(NOW(), INTERVAL 2 DAY))
       ON DUPLICATE KEY UPDATE description = VALUES(description)`
    )
    console.log("âœ… Signalements de test crÃ©Ã©s")

    // Initialiser les compteurs
    await connection.query(
      `INSERT INTO counters (name, value) VALUES
       ('report', 3),
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
