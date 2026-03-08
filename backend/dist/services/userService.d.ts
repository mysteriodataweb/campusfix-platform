import type { User, Role } from "../types/index.js";
export declare function getUsers(): Promise<User[]>;
export declare function getUserById(id: string): Promise<User | null>;
export declare function getUserByEmail(email: string): Promise<User | null>;
export declare function getUsersByRole(role: Role): Promise<User[]>;
export declare function updateUser(id: string, data: {
    name?: string;
    email?: string;
}): Promise<boolean>;
//# sourceMappingURL=userService.d.ts.map