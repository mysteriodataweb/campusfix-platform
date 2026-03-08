"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSystemLogs = getSystemLogs;
exports.addLog = addLog;
const db_js_1 = require("../config/db.js");
async function getSystemLogs() {
    const rows = await (0, db_js_1.query)("SELECT * FROM system_logs ORDER BY timestamp DESC LIMIT 100");
    return rows.map((row) => ({
        timestamp: row.timestamp.toISOString(),
        action: row.action,
        actor: row.actor,
    }));
}
async function addLog(action, actor) {
    await (0, db_js_1.execute)("INSERT INTO system_logs (action, actor) VALUES (?, ?)", [
        action,
        actor,
    ]);
}
//# sourceMappingURL=logService.js.map