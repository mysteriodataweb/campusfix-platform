"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ensureEmailVerificationSchema = ensureEmailVerificationSchema;
exports.createEmailVerificationToken = createEmailVerificationToken;
exports.verifyEmailToken = verifyEmailToken;
const crypto_1 = __importDefault(require("crypto"));
const db_js_1 = require("../config/db.js");
let emailVerificationSchemaReady = false;
async function ensureEmailVerificationSchema() {
    if (emailVerificationSchemaReady)
        return;
    try {
        await (0, db_js_1.execute)(`
      ALTER TABLE users
      ADD COLUMN email_verified BOOLEAN NOT NULL DEFAULT FALSE
    `);
    }
    catch (error) {
        const code = error.code;
        if (code !== "ER_DUP_FIELDNAME") {
            throw error;
        }
    }
    try {
        await (0, db_js_1.execute)(`
      ALTER TABLE users
      ADD COLUMN email_verified_at TIMESTAMP NULL DEFAULT NULL
    `);
    }
    catch (error) {
        const code = error.code;
        if (code !== "ER_DUP_FIELDNAME") {
            throw error;
        }
    }
    await (0, db_js_1.execute)(`
    CREATE TABLE IF NOT EXISTS email_verification_tokens (
      token_hash VARCHAR(64) PRIMARY KEY,
      user_id VARCHAR(50) NOT NULL,
      expires_at TIMESTAMP NOT NULL,
      used_at TIMESTAMP NULL DEFAULT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_user_id (user_id),
      INDEX idx_expires_at (expires_at)
    ) ENGINE=InnoDB
  `);
    // Keep existing admin/manager logins working after migration.
    await (0, db_js_1.execute)(`
    UPDATE users
    SET email_verified = TRUE,
        email_verified_at = COALESCE(email_verified_at, NOW())
    WHERE role IN ('manager', 'superadmin')
      AND email_verified = FALSE
  `);
    emailVerificationSchemaReady = true;
}
async function createEmailVerificationToken(userId) {
    await ensureEmailVerificationSchema();
    const rawToken = crypto_1.default.randomBytes(32).toString("hex");
    const tokenHash = crypto_1.default.createHash("sha256").update(rawToken).digest("hex");
    await (0, db_js_1.execute)(`INSERT INTO email_verification_tokens (token_hash, user_id, expires_at)
     VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 24 HOUR))
     ON DUPLICATE KEY UPDATE
       user_id = VALUES(user_id),
       expires_at = VALUES(expires_at),
       used_at = NULL`, [tokenHash, userId]);
    return rawToken;
}
async function verifyEmailToken(rawToken) {
    await ensureEmailVerificationSchema();
    const tokenHash = crypto_1.default.createHash("sha256").update(rawToken).digest("hex");
    const rows = await (0, db_js_1.query)(`SELECT user_id
     FROM email_verification_tokens
     WHERE token_hash = ?
       AND used_at IS NULL
       AND expires_at > NOW()`, [tokenHash]);
    if (rows.length === 0)
        return false;
    const userId = rows[0].user_id;
    await (0, db_js_1.execute)(`UPDATE email_verification_tokens
     SET used_at = NOW()
     WHERE token_hash = ?`, [tokenHash]);
    await (0, db_js_1.execute)(`UPDATE users
     SET email_verified = TRUE,
         email_verified_at = NOW()
     WHERE id = ?`, [userId]);
    return true;
}
//# sourceMappingURL=emailVerificationService.js.map