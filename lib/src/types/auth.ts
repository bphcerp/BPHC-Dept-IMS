import { userTypes } from "../schemas/Admin.ts";

export interface Permissions {
    allowed: string[];
    disallowed: string[];
}

export interface JwtPayload {
    email: string;
    userType: (typeof userTypes)[number];
    permissions: Permissions;
    sessionExpiry: number;
}
