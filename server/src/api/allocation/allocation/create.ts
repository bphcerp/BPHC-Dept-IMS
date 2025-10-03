import db from "@/config/db/index.ts";
import {
    allocationSection,
    allocationSectionInstructors,
    masterAllocation,
} from "@/config/db/schema/allocation.ts";
import { HttpError, HttpCode } from "@/config/errors.ts";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import express from "express";
import { courseAllocateSchema } from "node_modules/lib/src/schemas/Allocation.ts";
import { getLatestSemester } from "../semester/getLatest.ts";

const router = express.Router();

router.post(
    "/",
    asyncHandler(async (req, res, next) => {
        let { courseCode, ic, sections, semesterId } =
            courseAllocateSchema.parse(req.body);

        if (!semesterId) {
            semesterId = (await getLatestSemester())?.id;
            if (!semesterId)
                return next(
                    new HttpError(
                        HttpCode.BAD_REQUEST,
                        "No allocation going on"
                    )
                );
        }

        await db.transaction(async (tx) => {
            const master = ic
                ? await tx
                      .insert(masterAllocation)
                      .values({
                          courseCode,
                          ic,
                          semesterId,
                      })
                      .returning()
                      .onConflictDoUpdate({
                          target: [
                              masterAllocation.courseCode,
                              masterAllocation.semesterId,
                          ],
                          set: {
                              ic: ic,
                          },
                      })
                : await tx.insert(masterAllocation).values({
                      courseCode,
                      semesterId,
                  }).returning()
            for (const { type, instructors } of sections) {
                const [section] = await tx
                    .insert(allocationSection)
                    .values({
                        type,
                        masterId: master[0].id,
                    })
                    .returning();
                await tx.insert(allocationSectionInstructors).values(
                    instructors.map((email) => ({
                        sectionId: section.id,
                        instructorEmail: email,
                    }))
                );
            }
        });

        res.status(201).json({ success: true });
    })
);
export default router;
