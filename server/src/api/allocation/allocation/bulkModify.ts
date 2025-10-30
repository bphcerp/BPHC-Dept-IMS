import db from "@/config/db/index.ts";
import { allocationSectionInstructors } from "@/config/db/schema/allocation.ts";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import express from "express";
import { bulkModifySchema } from "node_modules/lib/src/schemas/Allocation.ts";
import { and, eq } from "drizzle-orm";
import { checkAccess } from "@/middleware/auth.ts";

const router = express.Router();

router.post(
  "/",
  checkAccess(),
  asyncHandler(async (req, res) => {
    const changes = bulkModifySchema.parse(req.body);

    if (changes.length === 0) {
      res
        .status(200)
        .json({ success: true, message: "No changes to apply." });
        return
    }

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
                eq(allocationSectionInstructors.sectionId, change.sectionId),
                eq(
                  allocationSectionInstructors.instructorEmail,
                  change.oldInstructorEmail,
                ),
              ),
            );
        }
      });

      await Promise.all(operations);
    });

    res
      .status(200)
      .json({ success: true, message: "Allocations updated successfully." });
  }),
);

export default router;