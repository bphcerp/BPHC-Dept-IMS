import express from "express";
import assert from "assert";
import db from "@/config/db/index.ts";
import { checkAccess } from "@/middleware/auth.ts";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import { handoutSchemas } from "lib";

const router = express.Router();

router.get(
    "/",
    checkAccess("faculty-get-all-handouts"),
    asyncHandler(async (req, res, _next) => {
        assert(req.user);

        const email = req.user.email;

        const applications = (
            await db.query.applications.findMany({
                where: (application, { eq }) => {
                    return eq(application.userEmail, email);
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
            const courseHandoutRequest = app.courseHandoutRequests[0] || {};
            return {
                id: app.id,
                courseCode: courseHandoutRequest?.courseCode?.value,
                courseName: courseHandoutRequest?.courseName?.value,
                status: app.status,
            };
        });

        res.status(200).json({ success: true, applications });
    })
);

export default router;
