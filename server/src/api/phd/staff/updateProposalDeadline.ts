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
// import { sendBulkEmails } from "@/lib/common/email.ts";

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
        if (id) {
            await db
                .update(phdProposalSemesters)
                .set(dataToUpsert)
                .where(eq(phdProposalSemesters.id, id));
        } else {
            await db.insert(phdProposalSemesters).values(dataToUpsert);
        }
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
        const body = `Dear BITS Community,\n\nPlease note that the PhD Proposal deadlines for the ${semester.year}Semester ${semester.semesterNumber}have been ${id ? "updated" : "announced"}.\n\n- Student Submission Deadline: ${dataToUpsert.studentSubmissionDate.toLocaleString()}\n- Supervisor Review Deadline: ${dataToUpsert.facultyReviewDate.toLocaleString()}\n- DRC Review Deadline: ${dataToUpsert.drcReviewDate.toLocaleString()}\n- DAC Review Deadline: ${dataToUpsert.dacReviewDate.toLocaleString()}\n\nPlease plan your submissions accordingly.`;
        await createNotifications(
            allUsers.map((user) => ({
                userEmail: user.email,
                module: modules[3],
                title: subject,
                content: body,
            }))
        );
        // await sendBulkEmails(
        //     allUsers.map((user) => ({ to: user.email, subject, text: body }))
        // );
        res.status(200).json({
            message: `Proposal deadlines ${id ? "updated" : "created"} successfully`,
        });
    })
);
