import express from "express";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import { checkAccess } from "@/middleware/auth.ts";
import { HttpError, HttpCode } from "@/config/errors.ts";
import db from "@/config/db/index.ts";
import { phd, faculty } from "@/config/db/schema/admin.ts";
import { eq, inArray, sql } from "drizzle-orm";
import z from "zod";

const router = express.Router();

router.post(
    "/",
    checkAccess(),
    asyncHandler(async (req, res, next) => {
        const schema = z.object({
            email: z.string().email(),
            selectedDacMembers: z.array(z.string().email())
        });

        const parsed = schema.safeParse(req.body);
        if (!parsed.success) {
            return next(new HttpError(HttpCode.BAD_REQUEST, "Invalid input format"));
        }

        const { email, selectedDacMembers } = parsed.data;

        const student = await db
            .select()
            .from(phd)
            .where(eq(phd.email, email))
            .then(rows => rows[0] || null);

        if (!student) {
            return next(new HttpError(HttpCode.NOT_FOUND, "PhD student not found"));
        }

        // Ensure we have suggested DAC members to choose from
        if (!selectedDacMembers || selectedDacMembers.length < 2) {
            return next(new HttpError(HttpCode.BAD_REQUEST, "Not enough suggested DAC members"));
        }

        // Get workload for each suggested faculty member
        const facultyWorkload = await db
            .select({
                facultyEmail: faculty.email,
                studentCount: sql<number>`(
                    SELECT COUNT(*) FROM phd WHERE 
                    phd.supervisor_email = ${faculty.email} OR 
                    phd.co_supervisor_email = ${faculty.email} OR 
                    phd.dac_1_email = ${faculty.email} OR 
                    phd.dac_2_email = ${faculty.email}
                )`
            })
            .from(faculty)
            .where(inArray(faculty.email, selectedDacMembers));

        // Sort faculty by workload (ascending)
        const sortedFaculty = facultyWorkload.sort((a, b) => (a.studentCount || 0) - (b.studentCount || 0));
        
        // Get the two faculty members with the least workload
        const topChoices = sortedFaculty.slice(0, 2).map(f => f.facultyEmail);
        
        res.json({
            success: true,
            topChoices,
            message: "Suggested two DAC members with the least workload"
        });
    })
);

export default router;
