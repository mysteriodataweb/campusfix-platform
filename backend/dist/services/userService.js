"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUsers = getUsers;
exports.getUserById = getUserById;
exports.getUserByEmail = getUserByEmail;
exports.getUsersByRole = getUsersByRole;
exports.updateUser = updateUser;
const db_js_1 = require("../config/db.js");
async function getUsers() {
    const rows = await (0, db_js_1.query)("SELECT * FROM users");
    return rows.map(mapUserRow);
}
async function getUserById(id) {
    const rows = await (0, db_js_1.query)("SELECT * FROM users WHERE id = ?", [id]);
    if (rows.length === 0)
        return null;
    return mapUserRow(rows[0]);
}
async function getUserByEmail(email) {
    const rows = await (0, db_js_1.query)("SELECT * FROM users WHERE email = ?", [email]);
    if (rows.length === 0)
        return null;
    return mapUserRow(rows[0]);
}
async function getUsersByRole(role) {
    const rows = await (0, db_js_1.query)("SELECT * FROM users WHERE role = ?", [role]);
    return rows.map(mapUserRow);
}
async function updateUser(id, data) {
    const updates = [];
    const values = [];
    if (data.name) {
        updates.push("name = ?");
        values.push(data.name);
    }
    if (data.email) {
        updates.push("email = ?");
        updates.push("email_verified = FALSE");
        updates.push("email_verified_at = NULL");
        values.push(data.email);
    }
    if (updates.length === 0)
        return false;
    values.push(id);
    const result = await (0, db_js_1.execute)(`UPDATE users SET ${updates.join(", ")} WHERE id = ?`, values);
    return result.affectedRows > 0;
}
function mapUserRow(row) {
    return {
        id: row.id,
        name: row.name,
        email: row.email,
        passwordHash: row.password_hash,
        role: row.role,
        createdAt: row.created_at.toISOString(),
        emailVerified: Boolean(row.email_verified),
        emailVerifiedAt: row.email_verified_at?.toISOString(),
    };
}
//# sourceMappingURL=userService.js.map