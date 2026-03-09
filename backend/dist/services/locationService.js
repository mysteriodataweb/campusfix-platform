"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getLocations = getLocations;
exports.getLocationById = getLocationById;
exports.createLocation = createLocation;
exports.deleteLocation = deleteLocation;
exports.generateLocationId = generateLocationId;
const db_js_1 = require("../config/db.js");
async function getLocations() {
    const rows = await (0, db_js_1.query)("SELECT * FROM locations ORDER BY name");
    return rows.map(mapLocationRow);
}
async function getLocationById(id) {
    const rows = await (0, db_js_1.query)("SELECT * FROM locations WHERE id = ?", [id]);
    if (rows.length === 0)
        return null;
    return mapLocationRow(rows[0]);
}
async function createLocation(location) {
    await (0, db_js_1.execute)(`INSERT INTO locations (id, name, building, qr_url)
     VALUES (?, ?, ?, ?)`, [location.id, location.name, location.building, location.qr_url]);
    const created = await getLocationById(location.id);
    if (!created) {
        throw new Error("Failed to fetch created location");
    }
    return created;
}
async function deleteLocation(id) {
    const result = await (0, db_js_1.execute)("DELETE FROM locations WHERE id = ?", [id]);
    return result.affectedRows > 0;
}
async function generateLocationId() {
    const connection = await (0, db_js_1.getConnection)();
    try {
        await connection.beginTransaction();
        await connection.execute("UPDATE counters SET value = value + 1 WHERE name = 'location'");
        const [rows] = await connection.query("SELECT value FROM counters WHERE name = 'location'");
        await connection.commit();
        const counter = rows[0]?.value || 1;
        return `loc-${String(counter).padStart(3, "0")}`;
    }
    catch (error) {
        await connection.rollback();
        throw error;
    }
    finally {
        connection.release();
    }
}
function mapLocationRow(row) {
    return {
        id: row.id,
        name: row.name,
        building: row.building,
        qr_url: row.qr_url,
        created_at: row.created_at.toISOString(),
    };
}
//# sourceMappingURL=locationService.js.map