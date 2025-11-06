import express from "express";
import db from "@/config/db/index.ts";
import { checkAccess } from "@/middleware/auth.ts";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import { eq } from "drizzle-orm";
import { semester } from "@/config/db/schema/allocation.ts";
import { updateSemesterSchema } from "node_modules/lib/src/schemas/Allocation.ts";

const router = express.Router();

router.post(
    "/:semesterId",
    checkAccess("allocation:write"),
    asyncHandler(async (req, res, next) => {
        const { semesterId } = updateSemesterSchema.parse(req.params);

        await db.transaction(async (tx) => {
            await tx.update(semester).set({ active: false });

            await tx
                .update(semester)
                .set({ active: true })
                .where(eq(semester.id, semesterId));
        });

        res.send("Semester activated successfully");
    })
);

export default router;
