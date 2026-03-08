"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const userService_js_1 = require("../services/userService.js");
const logService_js_1 = require("../services/logService.js");
const auth_js_1 = require("../middleware/auth.js");
const emailVerificationService_js_1 = require("../services/emailVerificationService.js");
const emailService_js_1 = require("../services/emailService.js");
const router = (0, express_1.Router)();
// GET /api/manager - Get manager info (superadmin only)
router.get("/", auth_js_1.authenticate, (0, auth_js_1.authorize)("superadmin"), async (_req, res) => {
    try {
        const managers = await (0, userService_js_1.getUsersByRole)("manager");
        const manager = managers[0];
        if (!manager) {
            res.status(404).json({ error: "Manager not found" });
            return;
        }
        res.json({
            id: manager.id,
            name: manager.name,
            email: manager.email,
            createdAt: manager.createdAt,
        });
    }
    catch (error) {
        console.error("Get manager error:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});
// PATCH /api/manager - Update manager info (superadmin only)
router.patch("/", auth_js_1.authenticate, (0, auth_js_1.authorize)("superadmin"), async (req, res) => {
    try {
        const managers = await (0, userService_js_1.getUsersByRole)("manager");
        const manager = managers[0];
        if (!manager) {
            res.status(404).json({ error: "Manager not found" });
            return;
        }
        const { name, email } = req.body;
        const normalizedEmail = typeof email === "string" ? email.trim().toLowerCase() : undefined;
        const emailChanged = !!normalizedEmail && normalizedEmail !== manager.email.toLowerCase();
        await (0, userService_js_1.updateUser)(manager.id, {
            name,
            email: emailChanged ? normalizedEmail : undefined,
        });
        if (emailChanged && normalizedEmail) {
            const token = await (0, emailVerificationService_js_1.createEmailVerificationToken)(manager.id);
            const backendUrl = process.env.BACKEND_URL || `http://localhost:${process.env.PORT || 5000}`;
            const verificationUrl = `${backendUrl}/api/auth/verify-email?token=${token}`;
            (0, emailService_js_1.sendEmailVerification)(manager.name, normalizedEmail, verificationUrl);
        }
        await (0, logService_js_1.addLog)(`Manager account updated`, "Super Admin");
        // Récupérer le manager mis à jour
        const updatedManagers = await (0, userService_js_1.getUsersByRole)("manager");
        const updatedManager = updatedManagers[0];
        res.json({
            success: true,
            manager: {
                id: updatedManager.id,
                name: updatedManager.name,
                email: updatedManager.email,
                createdAt: updatedManager.createdAt,
            },
        });
    }
    catch (error) {
        console.error("Update manager error:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});
exports.default = router;
//# sourceMappingURL=manager.js.map