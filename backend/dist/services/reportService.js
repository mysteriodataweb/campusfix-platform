"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getReports = getReports;
exports.getReportById = getReportById;
exports.createReport = createReport;
exports.updateReportStatus = updateReportStatus;
exports.updateReportNotified = updateReportNotified;
exports.generateReportId = generateReportId;
const db_js_1 = require("../config/db.js");
async function getReports() {
    const rows = await (0, db_js_1.query)("SELECT * FROM reports ORDER BY created_at DESC");
    return rows.map(mapReportRow);
}
async function getReportById(id) {
    const rows = await (0, db_js_1.query)("SELECT * FROM reports WHERE id = ?", [id]);
    if (rows.length === 0)
        return null;
    return mapReportRow(rows[0]);
}
async function createReport(report) {
    await (0, db_js_1.execute)(`INSERT INTO reports (id, location, issue_type, description, image_url, reporter_name, reporter_email, status, technician_notified)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`, [
        report.id,
        report.location,
        report.issue_type,
        report.description,
        report.image_url || null,
        report.reporter_name || null,
        report.reporter_email || null,
        report.status,
        report.technician_notified,
    ]);
    return report;
}
async function updateReportStatus(id, status) {
    const resolvedAt = status === "resolved" ? new Date().toISOString() : null;
    await (0, db_js_1.execute)(`UPDATE reports SET status = ?, resolved_at = ? WHERE id = ?`, [status, resolvedAt, id]);
    return getReportById(id);
}
async function updateReportNotified(id) {
    const result = await (0, db_js_1.execute)("UPDATE reports SET technician_notified = TRUE WHERE id = ?", [id]);
    return result.affectedRows > 0;
}
async function generateReportId() {
    const connection = await (0, db_js_1.getConnection)();
    try {
        await connection.beginTransaction();
        await connection.execute("UPDATE counters SET value = value + 1 WHERE name = 'report'");
        const [rows] = await connection.query("SELECT value FROM counters WHERE name = 'report'");
        await connection.commit();
        const counter = rows[0]?.value || 1;
        return `RPT-${String(counter).padStart(3, "0")}`;
    }
    catch (error) {
        await connection.rollback();
        throw error;
    }
    finally {
        connection.release();
    }
}
function mapReportRow(row) {
    return {
        id: row.id,
        location: row.location,
        issue_type: row.issue_type,
        description: row.description,
        image_url: row.image_url || undefined,
        reporter_name: row.reporter_name || undefined,
        reporter_email: row.reporter_email || undefined,
        status: row.status,
        created_at: row.created_at.toISOString(),
        updated_at: row.updated_at?.toISOString(),
        resolved_at: row.resolved_at?.toISOString(),
        technician_notified: Boolean(row.technician_notified),
    };
}
//# sourceMappingURL=reportService.js.map