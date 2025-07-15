import jwt from "jsonwebtoken";
import { refreshTokens } from "@/config/db/schema/admin.ts";
import env from "@/config/environment.ts";
import { eq } from "drizzle-orm";
import type { JwtPayload, Permissions, RoleAccessMap } from "@/types/auth.ts";
import type { Transaction } from "@/types/custom.ts";
import db, { type Tx } from "@/config/db/index.ts";
import { type adminSchemas, authUtils } from "lib";

/**
 * Generates an access token for the given email, session expiry, and operations.
 * @param email - The email associated with the access token.
 * @param sessionExpiry - The expiry time of the session in milliseconds.
 * @param permissions - The Permissions allowed for the access token.
 * @returns The generated access token.
 */
export const generateAccessToken = (
    email: string,
    userType: (typeof adminSchemas.userTypes)[number],
    sessionExpiry: number,
    permissions: Permissions
): string => {
    const jwtPayload: JwtPayload = {
        email,
        userType,
        sessionExpiry,
        permissions,
    };
    const accessToken = jwt.sign(jwtPayload, env.ACCESS_TOKEN_SECRET, {
        expiresIn: env.ACCESS_TOKEN_EXPIRY,
    });
    return accessToken;
};

/**
 * Generates a refresh token for the given email and transaction.
 * @param email - The email associated with the refresh token.
 * @param tx - The transaction to use for database operations.
 * @param oldTokenId - The ID of the old refresh token to delete.
 * @returns The generated refresh token and session expiry.
 */
export const generateRefreshToken = async (
    email: string,
    tx: Transaction,
    oldTokenId?: number
): Promise<{
    refreshToken: string;
    sessionExpiry: number;
}> => {
    const token = jwt.sign({ email }, env.REFRESH_TOKEN_SECRET, {
        expiresIn: env.REFRESH_TOKEN_EXPIRY,
    });
    const sessionExpiry = (jwt.decode(token) as { exp: number }).exp;
    const expiresAt = new Date(sessionExpiry * 1000);
    if (oldTokenId)
        await tx.delete(refreshTokens).where(eq(refreshTokens.id, oldTokenId));
    await tx.insert(refreshTokens).values({
        userEmail: email,
        token,
        expiresAt,
    });
    return { refreshToken: token, sessionExpiry };
};

/**
 * Get role access map from database and cache it in Redis.
 * @returns Role access map.
 */
export async function getRoleAccessMap(tx: typeof db | Tx = db) {
    const roleAccessMap = (await tx.query.roles.findMany()).reduce(
        (acc, role) => {
            acc[role.id] = {
                allowed: role.allowed,
                disallowed: role.disallowed,
            };
            return acc;
        },
        {} as RoleAccessMap
    );
    return roleAccessMap;
}

function getAccessFromMap(
    roles: number[],
    roleAccessMap: RoleAccessMap
): Permissions {
    const allowed = new Set<string>();
    const disallowed = new Set<string>();
    roles.forEach((roleId) => {
        const roleAccess = roleAccessMap[roleId];
        if (roleAccess) {
            roleAccess.disallowed.forEach((op) => {
                if (
                    ![...allowed].some((pat) =>
                        authUtils.matchWildcard(op, pat)
                    )
                )
                    disallowed.add(op);
            });
            roleAccess.allowed.forEach((op) => allowed.add(op));
        }
    });
    return {
        allowed: [...allowed],
        disallowed: [...disallowed],
    };
}

/**
 * Get flattened permissions for a given list of roles
 * @param roles - The list of roles to check access for.
 * @returns Access object containing allowed and disallowed operations.
 */
export async function getAccess(roles: number[]): Promise<Permissions> {
    const roleAccessMap = await getRoleAccessMap();
    return getAccessFromMap(roles, roleAccessMap);
}

/**
 * Retrieves access permissions for multiple roles by mapping them to a role access map.
 *
 * @param roles - A two-dimensional array where each inner array represents a group of role IDs.
 * @returns A promise that resolves to an array of `Permissions` objects corresponding to the provided roles.
 *
 * @throws Will throw an error if the role access map cannot be retrieved.
 */
export async function getAccessMultiple(
    roles: number[][],
    tx: typeof db | Tx = db
): Promise<Permissions[]> {
    const roleAccessMap = await getRoleAccessMap(tx);
    return roles.map((role) => getAccessFromMap(role, roleAccessMap));
}
