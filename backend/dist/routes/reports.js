"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const reportService_js_1 = require("../services/reportService.js");
const logService_js_1 = require("../services/logService.js");
const emailService_js_1 = require("../services/emailService.js");
const reporterService_js_1 = require("../services/reporterService.js");
const auth_js_1 = require("../middleware/auth.js");
const router = (0, express_1.Router)();
const validIssueTypes = [
    "Electricity",
    "IT",
    "Internet",
    "Plumbing",
    "Furniture",
    "Other",
];
// GET /api/reports - Get all reports (manager/superadmin only)
router.get("/", auth_js_1.authenticate, (0, auth_js_1.authorize)("manager", "superadmin"), async (_req, res) => {
    try {
        const reports = await (0, reportService_js_1.getReports)();
        res.json(reports);
    }
    catch (error) {
        console.error("Get reports error:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});
// GET /api/reports/:id - Get a single report (public for tracking)
router.get("/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const report = await (0, reportService_js_1.getReportById)(id);
        if (!report) {
            res.status(404).json({ error: "Report not found" });
            return;
        }
        res.json(report);
    }
    catch (error) {
        console.error("Get report error:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});
// POST /api/reports - Create a new report (public)
router.post("/", async (req, res) => {
    try {
        const { location, issue_type, description, image_url, reporter_name, reporter_email } = req.body;
        const normalizedReporterEmail = (0, reporterService_js_1.normalizeEmail)(String(reporter_email || ""));
        const normalizedReporterName = String(reporter_name || "").trim();
        if (!location || !issue_type || !description || !normalizedReporterEmail) {
            res.status(400).json({
                error: "Location, issue type, description, and email are required",
            });
            return;
        }
        if (!validIssueTypes.includes(issue_type)) {
            res.status(400).json({ error: "Invalid issue type" });
            return;
        }
        if (!(0, reporterService_js_1.isValidEmail)(normalizedReporterEmail)) {
            res.status(400).json({ error: "Invalid email address" });
            return;
        }
        const id = await (0, reportService_js_1.generateReportId)();
        const report = {
            id,
            location,
            issue_type,
            description,
            image_url: image_url || undefined,
            reporter_name: normalizedReporterName || undefined,
            reporter_email: normalizedReporterEmail,
            status: "pending",
            created_at: new Date().toISOString(),
            technician_notified: false,
        };
        await (0, reporterService_js_1.saveReporterEmailIfNew)(normalizedReporterEmail);
        await (0, reportService_js_1.createReport)(report);
        await (0, logService_js_1.addLog)(`New report submitted - ${id} - ${location}`, normalizedReporterName || "Anonymous");
        const trackingUrl = `/track/${id}`;
        (0, emailService_js_1.sendReportConfirmation)(report, trackingUrl);
        (0, emailService_js_1.sendNewReportNotification)(report, "manager@campus.com");
        res.json({ success: true, id, trackingUrl });
    }
    catch (error) {
        console.error("Create report error:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});
// PATCH /api/reports/:id - Update report status (manager only)
router.patch("/:id", auth_js_1.authenticate, (0, auth_js_1.authorize)("manager", "superadmin"), async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        const report = await (0, reportService_js_1.getReportById)(id);
        if (!report) {
            res.status(404).json({ error: "Report not found" });
            return;
        }
        if (status && ["pending", "in_progress", "resolved"].includes(status)) {
            const updatedReport = await (0, reportService_js_1.updateReportStatus)(id, status);
            await (0, logService_js_1.addLog)(`Status changed to ${status.replace("_", " ")} - ${id}`, "Manager");
            res.json({ success: true, report: updatedReport });
            return;
        }
        res.json({ success: true, report });
    }
    catch (error) {
        console.error("Update report error:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});
// POST /api/reports/:id/notify - Notify technician (manager only)
router.post("/:id/notify", auth_js_1.authenticate, (0, auth_js_1.authorize)("manager", "superadmin"), async (req, res) => {
    try {
        const { id } = req.params;
        const report = await (0, reportService_js_1.getReportById)(id);
        if (!report) {
            res.status(404).json({ error: "Report not found" });
            return;
        }
        await (0, reportService_js_1.updateReportNotified)(id);
        (0, emailService_js_1.sendTechnicianNotification)(report, "technician@campus.com");
        await (0, logService_js_1.addLog)(`Technician notified - ${id}`, "Manager");
        res.json({ success: true });
    }
    catch (error) {
        console.error("Notify error:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});
exports.default = router;
//# sourceMappingURL=reports.js.map