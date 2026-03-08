export declare function ensureEmailVerificationSchema(): Promise<void>;
export declare function createEmailVerificationToken(userId: string): Promise<string>;
export declare function verifyEmailToken(rawToken: string): Promise<boolean>;
//# sourceMappingURL=emailVerificationService.d.ts.map