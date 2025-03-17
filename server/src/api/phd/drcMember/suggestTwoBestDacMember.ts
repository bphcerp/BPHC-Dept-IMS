import express from "express";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import { checkAccess } from "@/middleware/auth.ts";
import { HttpError, HttpCode } from "@/config/errors.ts";
import db from "@/config/db/index.ts";
import { phd, faculty } from "@/config/db/schema/admin.ts";
import { eq, inArray, sql } from "drizzle-orm";
import {phdSchemas} from "lib"

const router = express.Router();

router.post(
    "/",
    checkAccess("drc-select-dac"), 
    asyncHandler(async (req, res, next) => {
  
        const parsed = phdSchemas.selectDacSchema.safeParse(req.body);
        if (!parsed.success) {
            return next(new HttpError(HttpCode.BAD_REQUEST, "Invalid input format"));
        }

        const { email, selectedDacMembers } = parsed.data;

        const student = await db.select().from(phd).where(eq(phd.email, email)).then(rows => rows[0] || null);
        if (!student) {
            return next(new HttpError(HttpCode.NOT_FOUND, "PhD student not found"));
        }

        if (!student.suggestedDacMembers || student.suggestedDacMembers.length < 5) {
            return next(new HttpError(HttpCode.BAD_REQUEST, "Student has not suggested DAC members"));
        }

        const facultyWorkload = await db
            .select({
                facultyEmail: faculty.email,
                studentCount: sql<number>`(
                    SELECT COUNT(*) FROM phd WHERE 
                    phd.supervisor_email = faculty.email OR 
                    phd.co_supervisor_email = faculty.email OR 
                    phd.dac_1_email = faculty.email OR 
                    phd.dac_2_email = faculty.email
                )`,
            })
            .from(faculty)
            .where(inArray(faculty.email, student.suggestedDacMembers));

        const sortedFaculty = facultyWorkload.sort((a, b) => (a.studentCount || 0) - (b.studentCount || 0));
        const leastLoadedFaculty = sortedFaculty.slice(0, 2).map(f => f.facultyEmail);

        await db
            .update(phd)
            .set({
                dac1Email: selectedDacMembers[0],
                dac2Email: selectedDacMembers[1],
            })
            .where(eq(phd.email, email));

        res.json({
            success: true,
            message: "DAC members selected successfully",
            topChoices: leastLoadedFaculty, 
            selectedDacMembers,
        });
    })
);

export default router;
