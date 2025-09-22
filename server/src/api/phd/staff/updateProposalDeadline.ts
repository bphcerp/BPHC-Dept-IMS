// server/src/api/phd/staff/updateProposalDeadline.ts
import express from "express";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import { checkAccess } from "@/middleware/auth.ts";
import { HttpError, HttpCode } from "@/config/errors.ts";
import db from "@/config/db/index.ts";
import { phdProposalSemesters } from "@/config/db/schema/phd.ts";
import { phdSchemas } from "lib";
import { eq } from "drizzle-orm";
import z from "zod";
const router = express.Router();
const updateProposalDeadlineSchemaWithId =
    phdSchemas.updateProposalDeadlineSchema.extend({
        id: z.number().int().positive().optional(),
    });
export default router.post(
    "/",
    checkAccess(),
    asyncHandler(async (req, res) => {
        const parsed = updateProposalDeadlineSchemaWithId.parse(req.body);
        const { id, semesterId, ...deadlines } = parsed;
        const semester = await db.query.phdSemesters.findFirst({
            where: (table, { eq }) => eq(table.id, semesterId),
        });
        if (!semester) {
            throw new HttpError(HttpCode.BAD_REQUEST, "Semester not found");
        }
        const dataToUpsert = {
            semesterId,
            studentSubmissionDate: new Date(deadlines.studentSubmissionDate),
            facultyReviewDate: new Date(deadlines.facultyReviewDate),
            drcReviewDate: new Date(deadlines.drcReviewDate),
            dacReviewDate: new Date(deadlines.dacReviewDate),
        };
        let result: (typeof phdProposalSemesters.$inferSelect)[];
        if (id) {
            result = await db
                .update(phdProposalSemesters)
                .set(dataToUpsert)
                .where(eq(phdProposalSemesters.id, id))
                .returning();
        } else {
            result = await db
                .insert(phdProposalSemesters)
                .values(dataToUpsert)
                .returning();
        }
        res.status(200).json({
            message: `Proposal deadlines ${id ? "updated" : "created"} successfully`,
            deadline: result[0],
        });
    })
);
