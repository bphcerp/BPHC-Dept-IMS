import { Request, Response } from "express";
import db from "@/config/db/index.ts";
import { checkAccess } from "@/middleware/auth.ts";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import express from "express";
import {
    wilpProject,
    wilpProjectsRange,
} from "@/config/db/schema/wilpProject.ts";
import { count, desc, eq, isNotNull } from "drizzle-orm";
import { faculty } from "@/config/db/schema/admin.ts";

const router = express.Router();

router.get(
    "/",
    checkAccess("wilp:project:stats"),
    asyncHandler(async (_req: Request, res: Response) => {
        const selectRange = await db
            .select()
            .from(wilpProjectsRange)
            .orderBy(desc(wilpProjectsRange.createdAt))
            .limit(1);

        const total = await db
            .select({ count: count(wilpProject.id) })
            .from(wilpProject);

        const selected = await db
            .select({ count: count(wilpProject.id) })
            .from(wilpProject)
            .where(isNotNull(wilpProject.facultyEmail));

        const facultyList = await db
            .select({
                faculty: faculty,
                selected: count(wilpProject.id),
            })
            .from(faculty)
            .leftJoin(wilpProject, eq(faculty.email, wilpProject.facultyEmail))
            .groupBy(faculty.email);

        res.json({
            range: {
                min: selectRange[0]?.min ?? null,
                max: selectRange[0]?.max ?? null,
            },
            projects: {
                total: total[0]?.count ?? 0,
                selected: selected[0]?.count ?? 0,
                unselected: (total[0]?.count ?? 0) - (selected[0]?.count ?? 0),
            },
            facultyList: facultyList.map((item) => ({
                faculty: {
                    name: item.faculty.name,
                    email: item.faculty.email,
                },
                selected: item.selected ?? 0,
                required: Math.max(
                    (selectRange[0]?.min ?? 0) - item.selected,
                    0
                ),
            })),
        });
    })
);

export default router;
