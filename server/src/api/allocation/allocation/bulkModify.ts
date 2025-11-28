import db from "@/config/db/index.ts";
import {
    allocationSectionInstructors,
    semester,
} from "@/config/db/schema/allocation.ts";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import express from "express";
import { bulkModifySchema } from "node_modules/lib/src/schemas/Allocation.ts";
import { and, eq, sql } from "drizzle-orm";
import { checkAccess } from "@/middleware/auth.ts";

const router = express.Router();

router.post(
    "/",
    checkAccess(),
    asyncHandler(async (req, res) => {
        const { semesterId, changes } = bulkModifySchema.parse(req.body);

        await db.transaction(async (tx) => {
            const operations = changes.map((change) => {
                if (change.oldInstructorEmail === null) {
                    return tx
                        .insert(allocationSectionInstructors)
                        .values({
                            sectionId: change.sectionId,
                            instructorEmail: change.newInstructorEmail,
                        })
                        .onConflictDoNothing();
                } else {
                    return tx
                        .update(allocationSectionInstructors)
                        .set({
                            instructorEmail: change.newInstructorEmail,
                        })
                        .where(
                            and(
                                eq(
                                    allocationSectionInstructors.sectionId,
                                    change.sectionId
                                ),
                                eq(
                                    allocationSectionInstructors.instructorEmail,
                                    change.oldInstructorEmail
                                )
                            )
                        );
                }
            });

            await Promise.all(operations);

            await tx.update(semester)
                .set({
                    allocationVersion: sql`${semester.allocationVersion} + 1`,
                })
                .where(eq(semester.id, semesterId));
        });

        res.status(200).json({
            success: true,
            message: "Allocations updated successfully.",
        });
    })
);

export default router;
