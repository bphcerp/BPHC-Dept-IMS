import type { Request, Response, NextFunction } from "express";
import db from "@/config/db/index.ts";
import { users } from "@/config/db/schema/admin.ts";
import { eq } from "drizzle-orm";
import { asyncHandler } from "./routeHandler.ts";

export const testingMiddleware = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
        if (!req.user || !req.user.email) {
            next();
            return;
        }

        const data = await db
            .select({ inTestingMode: users.inTestingMode })
            .from(users)
            .where(eq(users.email, req.user.email));
        if (!data.length) {
            next();
            return;
        }
        if (!data[0].inTestingMode) {
            next();
            return;
        }

        // Only allow GET requests in testing mode
        if (req.method !== "GET") {
            res.status(403).send(
                "Modifications are not allowed in testing mode"
            );
            return;
        }
        next();
    }
);
