import db from "@/config/db/index.ts";
import { course } from "@/config/db/schema/allocation.ts";
import { HttpError, HttpCode } from "@/config/errors.ts";
import { checkAccess } from "@/middleware/auth.ts";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import { Router } from "express";
import { courseSchema } from "../../../../../lib/src/schemas/Allocation.ts";
import { TTDCourse } from "../../../../../lib/src/types/allocation.ts";
import environment from "@/config/environment.ts";
import axios from "axios";
import { sql } from "drizzle-orm";

const router = Router();

router.post(
    "/:semester",
    checkAccess('allocation:courses:sync'),
    asyncHandler(async (req, res, next) => {
            const { semester } = req.params;

            if (!semester) {
                return next(
                    new HttpError(
                        HttpCode.BAD_REQUEST,
                        "Semester number is required."
                    )
                );
            }

            const parsedSemester = parseInt(semester);

            if (parsedSemester < 1 || parsedSemester > 3) {
                return next(
                    new HttpError(
                        HttpCode.BAD_REQUEST,
                        "Semester number must be between 1 and 3."
                    )
                );
            }

            // Fetch all the course data from TTD API
            const { data: courses } = await axios.get(
                `${environment.TTD_API_URL}/${parsedSemester}/courses?deptCode=${environment.DEPARTMENT_NAME}`
            );

            const mappedCourses = courses.map((courseData: TTDCourse) => {
                return courseSchema.parse({
                    code: `${courseData.deptCode} ${courseData.courseCode}`,
                    name: courseData.name,
                    lectureUnits: courseData.lectureUnits,
                    practicalUnits: courseData.labUnits,
                    totalUnits: courseData.totalUnits,
                    offeredAs: courseData.offeredAs === 'C' ? 'CDC' : 'Elective',
                    offeredTo: courseData.offeredTo,
                    offeredAlsoBy: courseData.offeredBy.filter((dept) => dept !== environment.DEPARTMENT_NAME),
                });
            });

            await db.insert(course).values(mappedCourses).onConflictDoUpdate({
                target: course.code,
                set: {
                    name: sql`EXCLUDED.name`,
                    code: sql`EXCLUDED.code`,
                    lectureUnits: sql`EXCLUDED.lecture_units`,
                    practicalUnits: sql`EXCLUDED.practical_units`,
                    totalUnits: sql`EXCLUDED.total_units`,
                    offeredAs: sql`EXCLUDED.offered_as`,
                    offeredAlsoBy: sql`EXCLUDED.offered_also_by`,
                    offeredTo: sql`EXCLUDED.offered_to`,
                }
            })

            res.status(200).json({ message: "Courses synced successfully." });
    })
);

export default router;
