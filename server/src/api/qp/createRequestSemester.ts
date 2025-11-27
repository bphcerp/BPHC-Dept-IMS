import db from "@/config/db/index.ts";
import { qpReviewRequests } from "@/config/db/schema/qp.ts";
import { HttpCode, HttpError } from "@/config/errors.ts";
import { checkAccess } from "@/middleware/auth.ts";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import express from "express";
import { createQPSemesterSchema } from "node_modules/lib/src/schemas/Qp.ts";

const router = express.Router();

router.post(
    "/",
    checkAccess(),
    asyncHandler(async (req, res, next) => {
        const { semesterId } = createQPSemesterSchema.parse(req.body);

        const sem = await db.query.semester.findFirst({
            where: (sem, { eq }) => eq(sem.id, semesterId),
        });
        if (!sem) {
            return next(
                new HttpError(HttpCode.NOT_FOUND, "Semester Not Found")
            );
        }
        const allocations = await db.query.masterAllocation.findMany({
            where: (master, { eq }) => eq(master.semesterId, sem.id),
            with: {
                course: true,
            },
        });

        for (const allocation of allocations) {
            if (allocation.course && allocation.course.offeredTo != "PhD") {
                await db.insert(qpReviewRequests).values({
                    courseCode: allocation.course.code,
                    courseName: allocation.course.name,
                    category: allocation.course.offeredTo,
                    requestType: "Both",
                });
            }
        }

        res.send("QP Requests Created Successfully");
    })
);

export default router;
