import express from "express";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import { checkAccess } from "@/middleware/auth.ts";
import { HttpError, HttpCode } from "@/config/errors.ts";
import db from "@/config/db/index.ts";
import { phdProposalSemesters } from "@/config/db/schema/phd.ts";
import { phdSchemas, modules } from "lib";
import { eq } from "drizzle-orm";
import z from "zod";
import { createNotifications } from "@/lib/todos/index.ts";

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

        // --- Automatically create in-app notifications ---
        const allPhdStudents = await db.query.phd.findMany({
            columns: { email: true },
        });
        const allFaculty = await db.query.faculty.findMany({
            columns: { email: true },
        });
        const allUsers = [...allPhdStudents, ...allFaculty];

        const subject = id
            ? "PhD Proposal Deadline Updated"
            : "New PhD Proposal Deadline Announced";
        const body = `Please note the PhD Proposal deadlines for the ${
            semester.year
        } Semester ${semester.semesterNumber} have been ${
            id ? "updated" : "announced"
        }.\n- Student Submission: ${dataToUpsert.studentSubmissionDate.toLocaleString()}\n- Supervisor Review: ${dataToUpsert.facultyReviewDate.toLocaleString()}\n- DRC Review: ${dataToUpsert.drcReviewDate.toLocaleString()}\n- DAC Review: ${dataToUpsert.dacReviewDate.toLocaleString()}`;

        if (allUsers.length > 0) {
            await createNotifications(
                allUsers.map((user) => ({
                    userEmail: user.email,
                    module: modules[3], // PhD Proposal Module
                    title: subject,
                    content: body,
                }))
            );
        }
        // --- End of notification logic ---

        res.status(200).json({
            message: `Proposal deadlines ${
                id ? "updated" : "created"
            } successfully. In-app notifications sent.`,
            deadline: result[0],
        });
    })
);
