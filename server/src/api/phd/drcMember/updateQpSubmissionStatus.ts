import express from "express";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import { checkAccess } from "@/middleware/auth.ts";
import db from "@/config/db/index.ts";
import { phdExaminerAssignments } from "@/config/db/schema/phd.ts";
import { eq, and } from "drizzle-orm";
import z from "zod";

const router = express.Router();

const updateQpSubmissionStatusSchema = z.object({
    applicationId: z.number().int().positive(),
    qualifyingArea: z.string().min(1),
    qpSubmitted: z.boolean(),
});

export default router.post(
    "/",
    checkAccess(),
    asyncHandler(async (req, res) => {
        const { applicationId, qualifyingArea, qpSubmitted } =
            updateQpSubmissionStatusSchema.parse(req.body);

        await db
            .update(phdExaminerAssignments)
            .set({ qpSubmitted })
            .where(
                and(
                    eq(phdExaminerAssignments.applicationId, applicationId),
                    eq(phdExaminerAssignments.qualifyingArea, qualifyingArea)
                )
            );

        res.json({
            success: true,
            message: "QP submission status updated successfully",
        });
    })
);
