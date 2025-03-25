import express from "express";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import { checkAccess } from "@/middleware/auth.ts";
import { HttpError, HttpCode } from "@/config/errors.ts";
import db from "@/config/db/index.ts";
import { phdSemesters, phdQualifyingExams } from "@/config/db/schema/phd.ts";
import { eq } from "drizzle-orm";

const router = express.Router();

export default router.post(
    "/",
    checkAccess(),
    asyncHandler(async (req, res) => {
        const { semesterId, deadline } = req.body;

        // Verify semester exists
        const semester = await db
            .select()
            .from(phdSemesters)
            .where(eq(phdSemesters.id, semesterId))
            .limit(1);

        if (semester.length === 0) {
            throw new HttpError(HttpCode.NOT_FOUND, "Semester not found");
        }

        // Define the proposal exam name
        const examName = "Thesis Proposal";

        const newProposal = await db
            .insert(phdQualifyingExams)
            .values({
                semesterId,
                examName,
                deadline: new Date(deadline),
            })
            .returning();

        res.status(201).json({
            success: true,
            message: "Proposal deadline created successfully",
            proposal: newProposal[0],
        });
    })
);
