import express from "express";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import { checkAccess } from "@/middleware/auth.ts";
import db from "@/config/db/index.ts";
import { phd } from "@/config/db/schema/admin.ts";
import { phdCourses } from "@/config/db/schema/phd.ts";
import { phdSchemas } from "lib";

const router = express.Router();

router.get(
    "/",
    checkAccess("drc-generate-coursework"),
    asyncHandler(async (_req, res) => {
        const phdStudents = await db.select().from(phd);
        const allCourses = await db.select().from(phdCourses);

        const coursesByStudent = allCourses.reduce((acc, course) => {
            acc[course.studentEmail] = course;
            return acc;
        }, {} as Record<string, typeof phdCourses.$inferSelect>);

        const formData = phdStudents.map((student) => {
            const coursesEntry = coursesByStudent[student.email];
            const courseNames = coursesEntry?.courseNames ?? [];
            const courseUnits = coursesEntry?.courseUnits ?? [];
            const courseGrades = coursesEntry?.courseGrades ?? [];

            const courses = courseNames.map((name, index) => ({
                name: name || "N/A",
                units: courseUnits[index] ?? null,
                grade: courseGrades[index] ?? "Pending"
            }));

            return {
                name: student.name || "Unknown",
                email: student.email,
                courses
            };
        });

        const validatedData = phdSchemas.courseworkFormSchema.parse(formData);

        res.status(200).json({
            success: true,
            formData: validatedData,
            formLink: "https://universe.bits-pilani.ac.in/uploads/A.Hyd%202014-15/AGSRD/Format%20for%20submitting%20the%20course%20work.pdf"
        });
    })
);

export default router;
