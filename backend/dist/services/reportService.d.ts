import type { Report, Status } from "../types/index.js";
export declare function getReports(): Promise<Report[]>;
export declare function getReportById(id: string): Promise<Report | null>;
export declare function createReport(report: Omit<Report, "updated_at">): Promise<Report>;
export declare function updateReportStatus(id: string, status: Status): Promise<Report | null>;
export declare function updateReportNotified(id: string): Promise<boolean>;
export declare function generateReportId(): Promise<string>;
//# sourceMappingURL=reportService.d.ts.map