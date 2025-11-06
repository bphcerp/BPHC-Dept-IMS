import express from "express";
import db from "@/config/db/index.ts";
import { checkAccess } from "@/middleware/auth.ts";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import { eq } from "drizzle-orm";
import assert from "assert";
import { getLatestSemester } from "./getLatest.ts";
import { HttpError, HttpCode } from "@/config/errors.ts";
import { semester } from "@/config/db/schema/allocation.ts";

const router = express.Router();

router.post(
    "/",
    checkAccess(),
    asyncHandler(async (req, res, next) => {
        assert(req.user);
        const latestSemester = await getLatestSemester();

        if (!latestSemester) {
            return next(
                new HttpError(
                    HttpCode.NOT_FOUND,
                    "No semesters found in the database"
                )
            );
        }

        if (!latestSemester.form) {
            return next(
                new HttpError(HttpCode.BAD_REQUEST, "Form not published yet")
            );
        }

        await db
            .update(semester)
            .set({ allocationStatus: "completed" })
            .where(eq(semester.id, latestSemester.id))
            .returning();

        res.send("Semester marked as completed successfully");
    })
);

export default router;
