import db from "@/config/db/index.ts";
import { checkAccess } from "@/middleware/auth.ts";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import express from "express";
import {
    CourseAllocationStatusResponse,
} from "node_modules/lib/src/types/allocation.ts";
import { getLatestSemester } from "../semester/getLatest.ts";
import { HttpError, HttpCode } from "@/config/errors.ts";

const router = express.Router();

export const getAllocationStats = async (semesterId: string) => {
    const masterAllocations = await db.query.masterAllocation.findMany({
        where: (alloc, { eq }) => eq(alloc.semesterId, semesterId),
        with: {
            course: true,
            sections: {
                with: {
                    instructors: true,
                },
            },
        },
    });

    const map = new Map<
        string,
        {
            sections: { id?: string; instructorsCount: number }[];
            hasIC: boolean;
            hasAllPracticalRoomsSet: boolean;
        }
    >();

    for (const m of masterAllocations) {
        const code = m.course?.code;
        let hasAllPracticalRoomsSet = true;
        if (!code) continue;
        const sections = (m.sections || []).map((s) => {
            if (s.type === "PRACTICAL" && !s.timetableRoomId)
                hasAllPracticalRoomsSet = false;

            return {
                id: (s as any).id,
                instructorsCount: ((s as any).instructors || []).length,
            };
        });
        const hasIC = Boolean((m as any).ic); // true if IC is set, false if null/undefined/empty
        map.set(code, { sections, hasIC, hasAllPracticalRoomsSet });
    }

    const allCourses = await db.query.course.findMany();

    const result: CourseAllocationStatusResponse = {};

    for (const c of allCourses) {
        const code = c.code;
        const entry = map.get(code);

        if (!entry) {
            result[code] = "Not Started";
            continue;
        }

        if (!entry.hasIC || !entry.hasAllPracticalRoomsSet) {
            result[code] = "Pending";
            continue;
        }

        if (entry.sections.length === 0) {
            result[code] = "Not Started";
            continue;
        }

        const sections = entry.sections;
        const numWithInstr = sections.filter(
            (s) => s.instructorsCount > 0
        ).length;

        if (numWithInstr === 0) {
            result[code] = "Not Started";
        } else if (numWithInstr === sections.length) {
            result[code] = "Allocated";
        } else {
            result[code] = "Pending";
        }
    }

    return result;
};

router.get(
    "/",
    checkAccess(),
    asyncHandler(async (req, res, next) => {
        const latestSemester = await getLatestSemester();
        const { semesterId } = req.query;

        if (!semesterId && !latestSemester)
            return next(
                new HttpError(HttpCode.BAD_REQUEST, "No allocation going on")
            );

        const result = await getAllocationStats(latestSemester?.id ?? (semesterId as string));

        res.status(200).json(result);
    })
);

export default router;
