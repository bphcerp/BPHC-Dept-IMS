import type { Request, Response, NextFunction } from "express";
import env from "@/config/environment";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { HttpError, HttpCode } from "@/config/errors";
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
                new HttpError(HttpCode.UNAUTHORIZED, "Unauthenticated")
            );
        }
        if (!requiredOperation) return next();
        const access = req.user.operations;
        if (
            access.disallowed.some((op) => matchWildcard(requiredOperation, op))
        ) {
            return next(
                new HttpError(
                    HttpCode.FORBIDDEN,
                    "Operation not allowed",
                    "Explicitly disallowed"
                )
            );
        }
        if (
            access.allowed.includes("*") ||
            access.allowed.some((op) => matchWildcard(requiredOperation, op))
        )
            return next();

        return next(
            new HttpError(
                HttpCode.FORBIDDEN,
                "Operation not allowed",
                "Insufficient permissions"
            )
        );
    };
}

// Attaches user object to req
export const authMiddleware = (
    req: Request,
    _res: Response,
    next: NextFunction
) => {
    const unauthenticatedError = new HttpError(
        HttpCode.UNAUTHORIZED,
        "Unauthenticated"
    );
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        unauthenticatedError.feedback = "Authorization header not provided";
        return next(unauthenticatedError);
    }
    const parts = authHeader.split(" ");
    if (parts.length !== 2 || parts[0] !== "Bearer") {
        unauthenticatedError.feedback = "Invalid authorization header";
        return next(unauthenticatedError);
    }

    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    jwt.verify(parts[1], env.ACCESS_TOKEN_SECRET, async (err, decoded) => {
        if (err) {
            unauthenticatedError.feedback = err.message;
            return next(unauthenticatedError);
        }
        const jwtPayloadSchema = z.object({
            email: z.string(),
            name: z.string(),
            operations: z.object({
                allowed: z.array(z.string()),
                disallowed: z.array(z.string()),
            }),
            iat: z.number(),
            sessionExpiry: z.number(),
        });
        const parsed = jwtPayloadSchema.safeParse(decoded);
        if (!parsed.success) {
            unauthenticatedError.feedback = "Invalid access token payload";
            return next(unauthenticatedError);
        }
        req.user = parsed.data;
        return next();
    });
};
