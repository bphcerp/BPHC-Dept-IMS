import express from "express";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import { checkAccess } from "@/middleware/auth.ts";
import db from "@/config/db/index.ts";
import { phd, faculty } from "@/config/db/schema/admin.ts";
import { isNotNull, inArray } from "drizzle-orm";

const router = express.Router();

router.get(
    "/",
    checkAccess(),
    asyncHandler(async (_req, res) => {
        const students = await db.query.phd.findMany({
            where: isNotNull(phd.supervisorEmail),
            columns: {
                email: true,
                name: true,
                supervisorEmail: true,
                qualifyingArea1: true,
                qualifyingArea2: true,
            },
        });

        const supervisorEmails = [
            ...new Set(students.map((student) => student.supervisorEmail)),
        ].filter((email) => email !== null);

        // No supervisors found
        if (supervisorEmails.length === 0) {
            res.status(404).json({ success: false, supervisors: [] });
        }

        // Use inArray for proper parameterized query
        const supervisors = await db
            .select({
                email: faculty.email,
                name: faculty.name,
            })
            .from(faculty)
            .where(inArray(faculty.email, supervisorEmails));

        const supervisorsWithStudents = supervisors.map((supervisor) => {
            const supervisorStudents = students.filter(
                (student) => student.supervisorEmail === supervisor.email
            );

            return {
                ...supervisor,
                students: supervisorStudents,
            };
        });

        res.status(200).json({
            success: true,
            supervisors: supervisorsWithStudents,
        });
    })
);

export default router;
