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
import { getLatestSemester } from "../semester/getLatest.ts";

const router = Router();

router.post(
    "/",
    checkAccess(),
    asyncHandler(async (_req, res, next) => {
            
            const latestSemester = await getLatestSemester()

            if (!latestSemester) {
                return next(
                    new HttpError(
                        HttpCode.BAD_REQUEST,
                        "There is no current semester set"
                    )
                );
            }

            // Fetch all the course data from TTD API
            const { data: courses } = await axios.get<TTDCourse[]>(
                `${environment.TTD_API_URL}/${latestSemester.semesterType}/courses?deptCode=${environment.DEPARTMENT_NAME}`
            );

            // Wilp courses are ignored they are not included in the allocation process.
            const mappedCourses = courses.filter((course) => !course.name.toUpperCase().includes('WILP')).map((courseData) => {
                return courseSchema.parse({
                    code: `${courseData.deptCode} ${courseData.courseCode}`,
                    name: courseData.name,
                    lectureUnits: courseData.lectureUnits,
                    practicalUnits: courseData.labUnits,
                    totalUnits: courseData.totalUnits,
                    offeredAs: courseData.offeredAs === 'C' ? 'CDC' : 'Elective',
                    offeredTo: courseData.offeredTo,
                    offeredAlsoBy: courseData.offeredBy.filter((dept) => dept !== environment.TTD_DEPARTMENT_NAME),
                    markedForAllocation: courseData.offeredAs === 'C'
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
                    markedForAllocation: sql`EXCLUDED.marked_for_allocation`,
                }
            })

            res.status(200).json({ message: "Courses synced successfully." });
    })
);

export default router;
