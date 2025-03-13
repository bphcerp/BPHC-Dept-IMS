export interface Permissions {
    allowed: string[];
    disallowed: string[];
}

export interface JwtPayload {
    email: string;
    permissions: Permissions;
    sessionExpiry: number;
}
