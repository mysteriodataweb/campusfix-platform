import type { Report } from "../types/index.js"

function log(subject: string, to: string, body: string) {
  console.log(`\n--- EMAIL SIMULATED ---`)
  console.log(`To: ${to}`)
  console.log(`Subject: ${subject}`)
  console.log(`Body:\n${body}`)
  console.log(`--- END EMAIL ---\n`)
}

export function sendReportConfirmation(report: Report, trackingUrl: string) {
  if (!report.reporter_email) return

  const subject = `Your maintenance report has been submitted - ${report.id}`
  const body = `Hello${report.reporter_name ? ` ${report.reporter_name}` : ""},

Your maintenance report has been received and logged in our system.

Ticket ID: ${report.id}
Location: ${report.location}
Issue Type: ${report.issue_type}
Description: ${report.description}

You can track your report at: ${trackingUrl}

We will address your issue as soon as possible.

- CampusFix Maintenance Team`

  log(subject, report.reporter_email, body)
}

export function sendNewReportNotification(report: Report, managerEmail: string) {
  const subject = `New maintenance report - ${report.location} - ${report.issue_type}`
  const body = `A new maintenance report has been submitted.

Ticket ID: ${report.id}
Location: ${report.location}
Issue Type: ${report.issue_type}
Description: ${report.description}
Reported by: ${report.reporter_name || "Anonymous"}

Please log in to your dashboard to manage this report.

- CampusFix System`

  log(subject, managerEmail, body)
}

export function sendTechnicianNotification(
  report: Report,
  technicianEmail: string
) {
  const subject = `Maintenance required - ${report.location}`
  const body = `A maintenance task requires your attention.

Location: ${report.location}
Issue Type: ${report.issue_type}
Description: ${report.description}
Date Reported: ${new Date(report.created_at).toLocaleDateString()}

Please address this issue as soon as possible.

- CampusFix System`

  log(subject, technicianEmail, body)
}

export function sendEmailVerification(
  name: string,
  email: string,
  verificationUrl: string
) {
  const subject = "Verify your email address - CampusFix"
  const body = `Hello ${name},

Please verify your email address by clicking the link below:
${verificationUrl}

This link expires in 24 hours.

If you did not request this, you can ignore this message.

- CampusFix Security`

  log(subject, email, body)
}
