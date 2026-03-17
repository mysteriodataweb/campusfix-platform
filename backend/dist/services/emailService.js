"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendReportConfirmation = sendReportConfirmation;
exports.sendNewReportNotification = sendNewReportNotification;
exports.sendTechnicianNotification = sendTechnicianNotification;
exports.sendEmailVerification = sendEmailVerification;
const nodemailer_1 = __importDefault(require("nodemailer"));
function log(subject, to, body) {
    console.log(`\n--- EMAIL SIMULATED ---`);
    console.log(`To: ${to}`);
    console.log(`Subject: ${subject}`);
    console.log(`Body:\n${body}`);
    console.log(`--- END EMAIL ---\n`);
}
const smtpHost = process.env.SMTP_HOST;
const smtpPort = parseInt(process.env.SMTP_PORT || "587", 10);
const smtpUser = process.env.SMTP_USER;
const smtpPass = process.env.SMTP_PASS;
const fromEmail = process.env.FROM_EMAIL || smtpUser || "no-reply@campusfix.local";
const smtpSecure = process.env.SMTP_SECURE === "true";
const smtpEnabled = Boolean(smtpHost && smtpUser && smtpPass && !Number.isNaN(smtpPort));
const transporter = smtpEnabled
    ? nodemailer_1.default.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: smtpSecure,
        auth: {
            user: smtpUser,
            pass: smtpPass,
        },
    })
    : null;
async function sendMail(to, subject, body) {
    if (!to)
        return;
    if (!transporter) {
        log(subject, to, body);
        return;
    }
    try {
        await transporter.sendMail({
            from: fromEmail,
            to,
            subject,
            text: body,
        });
    }
    catch (error) {
        console.error("Email send error:", error);
        log(subject, to, body);
    }
}
async function sendReportConfirmation(report, trackingUrl) {
    if (!report.reporter_email)
        return;
    const subject = `Your maintenance report has been submitted - ${report.id}`;
    const body = `Hello${report.reporter_name ? ` ${report.reporter_name}` : ""},

Your maintenance report has been received and logged in our system.

Ticket ID: ${report.id}
Location: ${report.location}
Issue Type: ${report.issue_type}
Description: ${report.description}

You can track your report at: ${trackingUrl}

We will address your issue as soon as possible.

- CampusFix Maintenance Team`;
    await sendMail(report.reporter_email, subject, body);
}
async function sendNewReportNotification(report, managerEmail) {
    const subject = `New maintenance report - ${report.location} - ${report.issue_type}`;
    const body = `A new maintenance report has been submitted.

Ticket ID: ${report.id}
Location: ${report.location}
Issue Type: ${report.issue_type}
Description: ${report.description}
Reported by: ${report.reporter_name || "Anonymous"}

Please log in to your dashboard to manage this report.

- CampusFix System`;
    await sendMail(managerEmail, subject, body);
}
async function sendTechnicianNotification(report, technicianEmail) {
    const subject = `Maintenance required - ${report.location}`;
    const body = `A maintenance task requires your attention.

Location: ${report.location}
Issue Type: ${report.issue_type}
Description: ${report.description}
Date Reported: ${new Date(report.created_at).toLocaleDateString()}

Please address this issue as soon as possible.

- CampusFix System`;
    await sendMail(technicianEmail, subject, body);
}
async function sendEmailVerification(name, email, verificationUrl) {
    const subject = "Verify your email address - CampusFix";
    const body = `Hello ${name},

Please verify your email address by clicking the link below:
${verificationUrl}

This link expires in 24 hours.

If you did not request this, you can ignore this message.

- CampusFix Security`;
    await sendMail(email, subject, body);
}
//# sourceMappingURL=emailService.js.map