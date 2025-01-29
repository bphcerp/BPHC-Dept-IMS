import { asyncHandler } from "@/middleware/routeHandler";
import express from "express";
import db from "@/config/db";
import { checkAccess } from "@/middleware/auth";
import { z } from "zod";
import { users } from "@/config/db/schema/admin";
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
        const parsed = querySchema.parse(req.query);
        const user = await db.query.users.findFirst({
            where: eq(users.email, parsed.email),
            with: {
                faculty: true,
                phd: true,
            },
        });

        if (!user) {
            next(new HttpError(HttpCode.NOT_FOUND, "User not found"));
            return;
        }

        const { faculty, phd, ...userData } = user;
        
        // If user is faculty type, include designation and room
        if (user.type === 'faculty' && faculty) {
            const { designation, room, ...otherFacultyData } = faculty;
            res.status(200).json({
                ...userData,
                ...otherFacultyData,
                designation,
                room,
            });
            return;
        }

        // For phd users
        res.status(200).json({
            ...userData,
            ...phd,
        });
        return;
    })
);

export default router;