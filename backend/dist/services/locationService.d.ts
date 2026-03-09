import type { Location } from "../types/index.js";
type NewLocation = Omit<Location, "created_at">;
export declare function getLocations(): Promise<Location[]>;
export declare function getLocationById(id: string): Promise<Location | null>;
export declare function createLocation(location: NewLocation): Promise<Location>;
export declare function deleteLocation(id: string): Promise<boolean>;
export declare function generateLocationId(): Promise<string>;
export {};
//# sourceMappingURL=locationService.d.ts.map