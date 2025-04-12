import db from "@/config/db/index.ts";
import { checkAccess } from "@/middleware/auth.ts";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import express from "express";

const router = express.Router();

router.get(
    "/",
    checkAccess(),
    asyncHandler(async (_req, res, _next) => {
        const faculties = (
            await db.query.users.findMany({
                where(cols, { and, eq }) {
                    return and(
                        eq(cols.type, "faculty"),
                        eq(cols.deactivated, false)
                    );
                },
                with: {
                    faculty: true,
                },
            })
        )
            .filter((faculty) => faculty.faculty)
            .map((faculty) => {
                return {
                    name: faculty.faculty.name,
                    email: faculty.email,
                    deactivated: faculty.deactivated,
                };
            });

        res.status(200).json({ success: true, faculties });
    })
);

export default router;
