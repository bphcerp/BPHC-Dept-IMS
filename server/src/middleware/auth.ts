import type { Request, Response, NextFunction } from "express";
import env, { PROD } from "@/config/environment.ts";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { HttpError, HttpCode } from "@/config/errors.ts";
import { authUtils, permissions } from "lib";
const permissionsMap: Record<string, string> = permissions;

const dequerify = (x: string) => x.split("?")[0];

/**
 * Middleware to check if the user has access to a specific operation.
 *
 * @param {string} [requiredOperation] - The operation that needs to be checked for access. If not provided, it will be derived from the request's base URL.
 * @returns {Function} Middleware function that checks user access.
 *
 * @throws {HttpError} If the user is unauthenticated, an error with status code 401 (UNAUTHORIZED) is thrown.
 * @throws {HttpError} If no permissions are found for the route, an error with status code 500 (INTERNAL_SERVER_ERROR) is thrown.
 * @throws {HttpError} If the user does not have sufficient permissions, an error with status code 403 (FORBIDDEN) is thrown.
 */
export function checkAccess(requiredOperation?: string) {
    return (req: Request, _res: Response, next: NextFunction) => {
        if (!req.user) {
            return next(
                new HttpError(HttpCode.UNAUTHORIZED, "Unauthenticated")
            );
        }
        if (!requiredOperation)
            requiredOperation =
                permissionsMap[
                    dequerify(PROD ? req.baseUrl : req.baseUrl.slice(4))
                ];
        if (!requiredOperation)
            return next(
                new HttpError(
                    HttpCode.INTERNAL_SERVER_ERROR,
                    "An error occurred",
                    "No permissions found for this route"
                )
            );
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
