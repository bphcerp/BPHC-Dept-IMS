import express from "express";
import assert from "assert";
import db from "@/config/db/index.ts";
import { applications } from "@/config/db/schema/form.ts";
import { courseHandoutRequests } from "@/config/db/schema/handout.ts";
import { checkAccess } from "@/middleware/auth.ts";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import { eq, inArray } from "drizzle-orm";

const router = express.Router();

router.get(
    "/",
    checkAccess("dca-get-all-applications"),
    asyncHandler(async (req, res, _next) => {
        assert(req.user);

        const results = await db
            .select({
                id: courseHandoutRequests.applicationId,
            })
            .from(courseHandoutRequests)
            .leftJoin(applications, eq(applications.status, "pending"));

        const data = await db.query.courseHandoutRequests.findMany({
            with: {
                courseCode: true,
                courseName: true,
                application: {
                    with: {
                        user: {
                            with: {
                                faculty: true,
                            },
                        },
                    },
                },
            },
            where: inArray(
                courseHandoutRequests.id,
                results.map((el) => el.id)
            ),
        });

        const apps = data.map((app) => {
            return {
                id: app.applicationId,
                courseCode: app.courseCode?.value,
                courseName: app.courseName?.value,
                professorName: app.application.user.faculty.name,
                status: app.application.status,
            };
        });

        res.status(200).json({ status: true, applications: apps });
    })
);

export default router;
