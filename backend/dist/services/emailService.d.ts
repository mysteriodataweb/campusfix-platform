import type { Report } from "../types/index.js";
export declare function sendReportConfirmation(report: Report, trackingUrl: string): void;
export declare function sendNewReportNotification(report: Report, managerEmail: string): void;
export declare function sendTechnicianNotification(report: Report, technicianEmail: string): void;
export declare function sendEmailVerification(name: string, email: string, verificationUrl: string): void;
//# sourceMappingURL=emailService.d.ts.map