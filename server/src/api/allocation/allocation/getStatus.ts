import db from "@/config/db/index.ts";
import { checkAccess } from "@/middleware/auth.ts";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import express from "express";
import { CourseAllocationStatusResponse } from "node_modules/lib/src/types/allocation.ts";
import { getLatestSemester } from "../semester/getLatest.ts";
import { HttpError, HttpCode } from "@/config/errors.ts";

const router = express.Router();

router.get(
  "/",
  checkAccess(),
  asyncHandler(async (_req, res, next) => {

    const latestSemester = await getLatestSemester()

    if (!latestSemester) return next(new HttpError(HttpCode.BAD_REQUEST, "No allocation going on"))

    const masterAllocations = await db.query.masterAllocation.findMany({
      where: (alloc, { eq }) => eq(alloc.semesterId, latestSemester.id),
      with: {
        course: true,
        sections: {
          with: {
            instructors: true,
          },
        },
      },
    });

    const map = new Map<string, { sections: { id?: string; instructorsCount: number }[] }>();

    for (const m of masterAllocations) {
      const code = m.course?.code;
      if (!code) continue;
      const sections = (m.sections || []).map((s) => ({
        id: (s as any).id,
        instructorsCount: ((s as any).instructors || []).length,
      }));
      map.set(code, { sections });
    }

    const allCourses = await db.query.course.findMany();

    const result: CourseAllocationStatusResponse = {};

    for (const c of allCourses) {
      const code = c.code;
      const entry = map.get(code);

      if (!entry || entry.sections.length === 0) {
        result[code] = "Not Started";
        continue;
      }

      const sections = entry.sections;
      const numWithInstr = sections.filter((s) => s.instructorsCount > 0).length;

      if (numWithInstr === 0) {
        result[code] = "Not Started";
      } else if (numWithInstr === sections.length) {
        result[code] = "Allocated";
      } else {
        result[code] = "Pending";
      }
    }

    res.status(200).json(result);
  })
);

export default router;