import express from "express";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import { checkAccess } from "@/middleware/auth.ts";
import { HttpError, HttpCode } from "@/config/errors.ts";
import db from "@/config/db/index.ts";
import { phdProposalSemesters } from "@/config/db/schema/phd.ts";
import { phdSchemas } from "lib";

const router = express.Router();

export default router.post(
    "/",
    checkAccess(),
    asyncHandler(async (req, res) => {
        const parsed = phdSchemas.updateProposalDeadlineSchema.parse(req.body);
        const { semesterId, ...deadlines } = parsed;

        const semester = await db.query.phdSemesters.findFirst({
            where: (table, { eq }) => eq(table.id, semesterId),
        });

        if (!semester) {
            throw new HttpError(HttpCode.BAD_REQUEST, "Semester not found");
        }

        const dataToInsert = {
            semesterId,
            studentSubmissionDate: new Date(deadlines.studentSubmissionDate),
            facultyReviewDate: new Date(deadlines.facultyReviewDate),
            drcReviewDate: new Date(deadlines.drcReviewDate),
            dacReviewDate: new Date(deadlines.dacReviewDate),
        };

        await db
            .insert(phdProposalSemesters)
            .values(dataToInsert)
            .onConflictDoUpdate({
                target: phdProposalSemesters.semesterId,
                set: dataToInsert,
            });

        res.status(200).json({
            message: "Proposal deadlines updated successfully",
        });
    })
);
