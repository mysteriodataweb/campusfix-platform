import type { Report } from "../types/index.js";
export declare function sendReportConfirmation(report: Report, trackingUrl: string): Promise<void>;
export declare function sendNewReportNotification(report: Report, managerEmail: string): Promise<void>;
export declare function sendTechnicianNotification(report: Report, technicianEmail: string): Promise<void>;
export declare function sendEmailVerification(name: string, email: string, verificationUrl: string): Promise<void>;
//# sourceMappingURL=emailService.d.ts.map