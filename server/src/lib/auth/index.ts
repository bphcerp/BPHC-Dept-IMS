import jwt from "jsonwebtoken";
import { refreshTokens } from "@/config/db/schema/admin.ts";
import env from "@/config/environment.ts";
import { eq } from "drizzle-orm";
import type { JwtPayload, Permissions, RoleAccessMap } from "@/types/auth.ts";
import type { Transaction } from "@/types/custom.ts";
import db from "@/config/db/index.ts";
import { authUtils } from "lib";

/**
 * Generates an access token for the given email, session expiry, and operations.
 * @param email - The email associated with the access token.
 * @param sessionExpiry - The expiry time of the session in milliseconds.
 * @param permissions - The Permissions allowed for the access token.
 * @returns The generated access token.
 */
export const generateAccessToken = (
    email: string,
    sessionExpiry: number,
    permissions: Permissions
): string => {
    const jwtPayload: JwtPayload = {
        email,
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
    const expiresAt = new Date(sessionExpiry * 100000);
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
export async function getRoleAccessMap() {
    const roleAccessMap = (await db.query.roles.findMany()).reduce(
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

/**
 * Get flattened permissions for a given list of roles
 * @param roles - The list of roles to check access for.
 * @returns Access object containing allowed and disallowed operations.
 */
export async function getAccess(roles: number[]): Promise<Permissions> {
    const allowed = new Set<string>();
    const disallowed = new Set<string>();
    const roleAccessMap = await getRoleAccessMap();
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
