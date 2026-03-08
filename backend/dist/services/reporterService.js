"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.normalizeEmail = normalizeEmail;
exports.isValidEmail = isValidEmail;
exports.saveReporterEmailIfNew = saveReporterEmailIfNew;
const crypto_1 = __importDefault(require("crypto"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const db_js_1 = require("../config/db.js");
let reporterRoleReady = false;
function normalizeEmail(email) {
    return email.trim().toLowerCase();
}
function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}
async function ensureReporterRoleSupport() {
    if (reporterRoleReady)
        return;
    await (0, db_js_1.execute)(`
    ALTER TABLE users
    MODIFY role ENUM('manager', 'superadmin', 'reporter') NOT NULL
  `);
    reporterRoleReady = true;
}
async function saveReporterEmailIfNew(rawEmail) {
    const email = normalizeEmail(rawEmail);
    await ensureReporterRoleSupport();
    const syntheticId = `rpt-${crypto_1.default.randomUUID().slice(0, 12)}`;
    const lockedPassword = await bcryptjs_1.default.hash(crypto_1.default.randomUUID(), 10);
    await (0, db_js_1.execute)(`INSERT INTO users (id, name, email, password_hash, role)
     VALUES (?, 'Reporter', ?, ?, 'reporter')
     ON DUPLICATE KEY UPDATE email = VALUES(email)`, [syntheticId, email, lockedPassword]);
}
//# sourceMappingURL=reporterService.js.map