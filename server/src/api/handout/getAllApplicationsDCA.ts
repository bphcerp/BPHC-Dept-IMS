import express from "express";
import assert from "assert";
import db from "@/config/db/index.ts";
import { checkAccess } from "@/middleware/auth.ts";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import { modules } from "lib";

const router = express.Router();

router.get(
    "/",
    checkAccess("dca-get-all-applications"),
    asyncHandler(async (req, res, _next) => {
        assert(req.user);

        const applications = (
            await db.query.applications.findMany({
                where({ status, module }, { and, eq }) {
                    return and(eq(module, modules[1]), eq(status, "pending"));
                },
                with: {
                    courseHandoutRequests: {
                        with: {
                            courseCode: true,
                            courseName: true,
                        },
                    },
                    user: {
                        with: {
                            faculty: true,
                        },
                    },
                },
            })
        ).map((app) => {
            const courseHandoutRequest = app.courseHandoutRequests[0];
            return {
                id: app.id,
                courseCode: courseHandoutRequest.courseCode?.value,
                courseName: courseHandoutRequest.courseName?.value,
                professorName: app.user.faculty.name,
                status: app.status,
            };
        });

        res.status(200).json({ success: true, applications });
    })
);

export default router;
