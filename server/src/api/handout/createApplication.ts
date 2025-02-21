import express from "express";
import assert from "assert";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import { z } from "zod";
import db from "@/config/db/index.ts";
import { textFields } from "@/config/db/schema/form.ts";
import { courseHandoutRequests } from "@/config/db/schema/handout.ts";

const router = express.Router();

const createApplicationBodySchema = z.object({
    courseCode: z.string().nonempty(),
    courseName: z.string().nonempty(),
    openBook: z.string().nonempty(),
    closedBook: z.string().nonempty(),
    midSem: z.string().nonempty(),
    compre: z.string().nonempty(),
    frequency: z.string().nonempty(),
    numComponents: z
        .string()
        .nonempty()
        .refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
            message: "Number of components must be a positive number",
        }),
});

router.post(
    "/",
    asyncHandler(async (req, res, next) => {
        const parsed = createApplicationBodySchema.parse(req.body);

        await db.transaction(async (tx) => {
            assert(req.user);

            const insertedIds: Record<string, number> = {};

            for (const [key, value] of Object.entries(parsed)) {
                const inserted = await tx
                    .insert(textFields)
                    .values({
                        value,
                        module: "Course Handout",
                    })
                    .returning();

                insertedIds[key] = inserted[0].id;
            }

            await tx.insert(courseHandoutRequests).values({
                courseCode: insertedIds.courseCode,
                courseName: insertedIds.courseName,
                openBook: insertedIds.openBook,
                closedBook: insertedIds.closedBook,
                midSem: insertedIds.midSem,
                compre: insertedIds.compre,
                numComponents: insertedIds.numComponents,
                frequency: insertedIds.frequency,
                userEmail: req.user.email,
            });
        });

        res.status(201).json({ success: true });
    })
);

export default router;
