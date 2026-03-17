import type { Report, Status } from "../types/index.js";
type NewReportInput = Omit<Report, "id" | "created_at" | "updated_at" | "resolved_at">;
export declare function getReports(): Promise<Report[]>;
export declare function getReportById(id: string | number): Promise<Report | null>;
export declare function createReport(report: NewReportInput): Promise<Report>;
export declare function updateReportStatus(id: string, status: Status): Promise<Report | null>;
export declare function updateReportNotified(id: string): Promise<boolean>;
export {};
//# sourceMappingURL=reportService.d.ts.map