// This middleware checks for user but still allows unauthenticated access
import type { Request, Response, NextFunction } from "express";
import env from "@/config/environment.ts";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { adminSchemas} from "lib";

export const optionalAuth = (
    req: Request,
    _res: Response,
    next: NextFunction
) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return next();
    }
    const parts = authHeader.split(" ");
    if (parts.length !== 2 || parts[0] !== "Bearer") {
        return next();
    }

    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    jwt.verify(parts[1], env.ACCESS_TOKEN_SECRET, async (err, decoded) => {
        if (err) {
            return next();
        }
        const jwtPayloadSchema = z.object({
            email: z.string(),
            userType: z.enum(adminSchemas.userTypes),
            permissions: z.object({
                allowed: z.array(z.string()),
                disallowed: z.array(z.string()),
            }),
            sessionExpiry: z.number(),
        });
        const parsed = jwtPayloadSchema.safeParse(decoded);
        if (!parsed.success) {
            return next();
        }
        req.user = parsed.data;
        return next();
    });
};