import express from "express";
import db from "@/config/db/index.ts";
import { checkAccess } from "@/middleware/auth.ts";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import { eq } from "drizzle-orm";
import assert from "assert";
import { getLatestSemesterMinimal } from "./getLatest.ts";
import { HttpError, HttpCode } from "@/config/errors.ts";
import { semester } from "@/config/db/schema/allocation.ts";

const router = express.Router();

router.post(
    "/",
    checkAccess("allocation:form:publish"),
    asyncHandler(async (req, res, next) => {
        assert(req.user);
        const { semesterId } = req.query;

        let semesterToUpdate = null;

        if (semesterId && typeof semesterId === "string") {
            semesterToUpdate = await db
                .select()
                .from(semester)
                .where(eq(semester.id, semesterId))
                .limit(1)
                .then((rows) => (rows.length > 0 ? rows[0] : null));
            if (!semesterToUpdate) {
                return next(
                    new HttpError(
                        HttpCode.NOT_FOUND,
                        "Semester not found with the provided ID"
                    )
                );
            }
        } else {
            semesterToUpdate = await getLatestSemesterMinimal();

            if (!semesterToUpdate) {
                return next(
                    new HttpError(
                        HttpCode.NOT_FOUND,
                        "No semesters found in the database"
                    )
                );
            }
        }

        await db
            .update(semester)
            .set({ summaryHidden: !semesterToUpdate.summaryHidden })
            .where(eq(semester.id, semesterToUpdate.id))
            .returning();

        res.send("Semester summary access updated");
    })
);

export default router;
