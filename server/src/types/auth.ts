import type { authTypes } from "lib";

export type Permissions = authTypes.Permissions;
export type JwtPayload = authTypes.JwtPayload;

export interface Access {
    allowed: string[];
    disallowed: string[];
}

export type RoleAccessMap = Record<number, Access>;
