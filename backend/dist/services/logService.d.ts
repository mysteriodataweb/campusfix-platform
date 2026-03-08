import type { SystemLog } from "../types/index.js";
export declare function getSystemLogs(): Promise<SystemLog[]>;
export declare function addLog(action: string, actor: string): Promise<void>;
//# sourceMappingURL=logService.d.ts.map