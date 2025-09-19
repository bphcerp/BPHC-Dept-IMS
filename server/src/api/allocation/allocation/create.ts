import db from "@/config/db/index.ts";
import {
    allocationSection,
    allocationSectionInstructors,
    masterAllocation,
} from "@/config/db/schema/allocation.ts";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import express from "express";
import { courseAllocateSchema } from "node_modules/lib/src/schemas/Allocation.ts";

const router = express.Router();

router.post(
    "/",
    asyncHandler(async (req, res, _next) => {
        const { courseCode, ic, sections } = courseAllocateSchema.parse(
            req.body
        );

        await db.transaction(async (tx) => {
            const master = await tx
                .insert(masterAllocation)
                .values({
                    courseCode,
                    ic,
                })
                .returning();
            for (const { type, number, instructors } of sections) {
                const section = await tx
                    .insert(allocationSection)
                    .values({
                        type,
                        number,
                        masterId: master[0].id,
                    })
                    .returning();
                await tx.insert(allocationSectionInstructors).values(
                    instructors.map((email) => ({
                        sectionId: section[0].id,
                        instructorEmail: email,
                    }))
                );
            }
        });

        res.status(201).json({ success: true });
    })
);
export default router;
