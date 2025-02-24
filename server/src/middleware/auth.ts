import type { Request, Response, NextFunction } from "express";
import env from "@/config/environment.ts";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { HttpError, HttpCode } from "@/config/errors.ts";
import { authUtils } from "lib";

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
        const allowed = authUtils.checkAccess(
            requiredOperation,
            req.user.permissions
        );
        if (!allowed) {
            return next(
                new HttpError(
                    HttpCode.FORBIDDEN,
                    "Operation not allowed",
                    "Insufficient permissions"
                )
            );
        }
        return next();
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
            permissions: z.object({
                allowed: z.array(z.string()),
                disallowed: z.array(z.string()),
            }),
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
