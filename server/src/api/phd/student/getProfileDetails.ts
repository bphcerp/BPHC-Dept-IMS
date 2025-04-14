import express from "express";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import { checkAccess } from "@/middleware/auth.ts";
import db from "@/config/db/index.ts";
import { HttpError, HttpCode } from "@/config/errors.ts";
import { phd } from "@/config/db/schema/admin.ts";
import { phdCourses } from "@/config/db/schema/phd.ts";
import { eq } from "drizzle-orm";
import assert from "assert";

const router = express.Router();

// Define interface for course items
interface CourseItem {
  courseName: string;
  courseGrade: string | null;
  courseUnits: number | null;
  courseId: string | null;
}

router.get(
  "/",
  checkAccess(),
  asyncHandler(async (req, res, next) => {
    assert(req.user, "User should be defined");
    const studentEmail = req.user.email;

    // Get student details
    const student = await db.query.phd.findFirst({
      where: eq(phd.email, studentEmail),
    });

    if (!student) {
      return next(new HttpError(HttpCode.NOT_FOUND, "Student not found"));
    }

    // Get courses and grades
    const courses = await db.query.phdCourses.findFirst({
      where: eq(phdCourses.studentEmail, studentEmail),
    });

    // Initialize with proper typing
    let formattedCourses: CourseItem[] = [];

    // Format student courses with proper null checks
    if (courses && courses.courseNames) {
      // Combine course details from parallel arrays
      formattedCourses = courses.courseNames.map((name, index) => ({
        courseName: name,
        courseGrade: courses.courseGrades ? courses.courseGrades[index] : null,
        courseUnits: courses.courseUnits ? courses.courseUnits[index] : null,
        courseId: courses.courseIds ? courses.courseIds[index] : null
      }));
    }

    // Return complete profile
    res.status(HttpCode.OK).json({
      success: true,
      student: {
        ...student,
        courses: formattedCourses
      }
    });
  })
);

export default router;
