export interface Operations {
    allowed: string[];
    disallowed: string[];
}

export interface JwtPayload {
    email: string;
    operations: Operations;
    sessionExpiry: number;
}

export interface Access {
    allowed: string[];
    disallowed: string[];
}

export type RoleAccessMap = Record<number, Access>;
