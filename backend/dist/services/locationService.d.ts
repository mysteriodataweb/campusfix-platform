import type { Location } from "../types/index.js";
export declare function getLocations(): Promise<Location[]>;
export declare function getLocationById(id: string): Promise<Location | null>;
export declare function createLocation(location: Location): Promise<Location>;
export declare function deleteLocation(id: string): Promise<boolean>;
export declare function generateLocationId(): Promise<string>;
//# sourceMappingURL=locationService.d.ts.map