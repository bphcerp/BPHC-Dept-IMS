import { adminSchemas } from "@/index.ts";

export interface Permissions {
    allowed: string[];
    disallowed: string[];
}

export interface JwtPayload {
    email: string;
    userType: (typeof adminSchemas.userTypes)[number];
    permissions: Permissions;
    sessionExpiry: number;
}
