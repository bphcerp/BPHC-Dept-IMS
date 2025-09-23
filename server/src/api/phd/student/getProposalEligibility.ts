import express from "express";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import { checkAccess } from "@/middleware/auth.ts";
import assert from "assert";
import db from "@/config/db/index.ts";
import { HttpError, HttpCode } from "@/config/errors.ts";

const router = express.Router();

export default router.get(
    "/",
    checkAccess(),
    asyncHandler(async (req, res) => {
        assert(req.user, "User must be authenticated");
        if (!req.user) {
            throw new HttpError(
                HttpCode.UNAUTHORIZED,
                "User not authenticated"
            );
        }
        let user = req.user;
        const studentProfile = await db.query.phd.findFirst({
            where: (cols, { eq }) => eq(cols.email, user.email),
            columns: {
                hasPassedQe: true,
                qualificationDate: true,
            },
        });

        if (!studentProfile) {
            throw new HttpError(
                HttpCode.NOT_FOUND,
                "Student profile not found."
            );
        }

        res.status(200).json({
            isEligible: studentProfile.hasPassedQe,
            qualificationDate:
                studentProfile.qualificationDate?.toISOString() ?? null,
            // isEligible: true,
            // qualificationDate: "2023-06-15T00:00:00.000Z",
        });
    })
);
