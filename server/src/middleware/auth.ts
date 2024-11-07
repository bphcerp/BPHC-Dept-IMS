import type { Request, Response, NextFunction } from "express";
import { ACCESS_TOKEN_SECRET, REDIS_KEYS } from "@/config/environment";
import jwt from "jsonwebtoken";
import { z } from "zod";
import redisClient from "@/lib/redis";
import logger from "@/lib/logger";
import { AppError, HttpCode } from "@/config/errors";
import { matchWildcard } from "@/lib/auth";

/**
 * Middleware function to check if a user has access to a given operation.
 * If the operation is not allowed, it will return a 403 Forbidden error.
 * @param requiredOperation - The operation to check access for.
 * @returns Express middleware function.
 */
export function checkAccess(requiredOperation?: string) {
    return (req: Request, _res: Response, next: NextFunction) => {
        if (!req.user) {
            return next(
                new AppError({
                    httpCode: HttpCode.UNAUTHORIZED,
                    description: "Unauthenticated",
                })
            );
        }
        if (!requiredOperation) return next();
        const access = req.user.operations;
        if (
            access.disallowed.some((op) => matchWildcard(requiredOperation, op))
        ) {
            return next(
                new AppError({
                    httpCode: HttpCode.FORBIDDEN,
                    description: "Operation not allowed",
                    feedback: "Explicitly disallowed",
                })
            );
        }
        if (
            access.allowed.includes("*") ||
            access.allowed.some((op) => matchWildcard(requiredOperation, op))
        )
            return next();

        return next(
            new AppError({
                httpCode: HttpCode.FORBIDDEN,
                description: "Operation not allowed",
                feedback: "Insufficient permissions",
            })
        );
    };
}

// Attaches user object to req
export const authMiddleware = (
    req: Request,
    _res: Response,
    next: NextFunction
) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return next();
    }
    const parts = authHeader.split(" ");
    if (parts.length !== 2 || parts[0] !== "Bearer") return next();

    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    jwt.verify(parts[1], ACCESS_TOKEN_SECRET, async (err, decoded) => {
        if (err) return next();
        const jwtPayloadSchema = z.object({
            email: z.string(),
            operations: z.object({
                allowed: z.array(z.string()),
                disallowed: z.array(z.string()),
            }),
            iat: z.number(),
            sessionExpiry: z.number(),
        });
        const parsed = jwtPayloadSchema.safeParse(decoded);
        if (!parsed.success) {
            logger.debug("Invalid JWT access token payload");
            return next();
        }

        // check if sessions were invalidated
        const lastSessionInvalidation = await redisClient.get(
            REDIS_KEYS.lastSessionInvalidation(parsed.data.email)
        );
        if (
            lastSessionInvalidation &&
            parsed.data.iat <= +lastSessionInvalidation
        ) {
            logger.debug("Access token expired");
            return next();
        }

        req.user = parsed.data;
        return next();
    });
};
