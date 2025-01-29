import { asyncHandler } from "@/middleware/routeHandler";
import express from "express";
import db from "@/config/db";
import { checkAccess } from "@/middleware/auth";
import { z } from "zod";
import { users, faculty, phd } from "@/config/db/schema/admin";
import { HttpCode, HttpError } from "@/config/errors";
import { eq } from "drizzle-orm";
const router = express.Router();

const querySchema = z.object({
    email: z.string().email(),
});

router.get(
    "/",
    checkAccess("member:read"),
    asyncHandler(async (req, res, next) => {
        const parsed = querySchema.parse(req.body);
        const user = await db
            .select()
            .from(users)
            .where(eq(users.email, parsed.email))
            .limit(1);        
        if (!user || user.length === 0) {
            return next(
                new HttpError(HttpCode.NOT_FOUND, "User not found")
            );
        }
        // check if user is faculty or phd
        
        if (user[0].type === "faculty") {
            const facultyUser = await db
                .select()
                .from(faculty)
                .where(eq(faculty.email, parsed.email))
                .limit(1);

            // extend user object with faculty details
            user[0] = { ...user[0], ...facultyUser[0] };

        } else if (user[0].type === "phd") {
            const phdUser = await db
                .select()
                .from(phd)
                .where(eq(phd.email, parsed.email))
                .limit(1);

            // extend user object with phd details
            user[0] = { ...user[0], ...phdUser[0] };
        }

        res.status(200).json(user[0]);
    })
);

export default router;