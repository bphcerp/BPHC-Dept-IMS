import express from "express";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import { checkAccess } from "@/middleware/auth.ts";
import db from "@/config/db/index.ts";
import { phdSemesters } from "@/config/db/schema/phd.ts";
import { phdSchemas } from "lib";

const router = express.Router();

router.post(
    "/",
    checkAccess(),
    asyncHandler(async (req, res) => {
        const parsed = phdSchemas.updateSemesterDatesSchema.parse(req.body);
        const { year, semesterNumber, startDate, endDate } = parsed;
        await db
            .insert(phdSemesters)
            .values({
                year,
                semesterNumber,
                startDate: new Date(startDate),
                endDate: new Date(endDate),
            })
            .onConflictDoUpdate({
                target: [phdSemesters.year, phdSemesters.semesterNumber],
                set: {
                    startDate: new Date(startDate),
                    endDate: new Date(endDate),
                },
            });
        res.status(200).send();
    })
);

export default router;
