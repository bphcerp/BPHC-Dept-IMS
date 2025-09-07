import express from "express";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import { checkAccess } from "@/middleware/auth.ts";
import db from "@/config/db/index.ts";
import { phdSchemas } from "lib";
import { phdExamApplications } from "@/config/db/schema/phd.ts";
import { phd } from "@/config/db/schema/admin.ts";
import { eq, sql } from "drizzle-orm";
import { HttpError, HttpCode } from "@/config/errors.ts";
import { createTodos } from "@/lib/todos/index.ts";
import assert from "assert";

const router = express.Router();

export default router.post(
    "/",
    checkAccess(),
    asyncHandler(async (req, res) => {
        assert(req.user, "User is not defined.");
        const { applicationId, result } = phdSchemas.submitResultSchema.parse(
            req.body
        );

        const application = await db.query.phdExamApplications.findFirst({
            where: eq(phdExamApplications.id, applicationId),
        });

        if (!application) {
            throw new HttpError(HttpCode.NOT_FOUND, "Application not found.");
        }

        if (application.result) {
            throw new HttpError(
                HttpCode.BAD_REQUEST,
                "Result has already been submitted for this application."
            );
        }

        await db.transaction(async (tx) => {
            // Update application result
            await tx
                .update(phdExamApplications)
                .set({ result })
                .where(eq(phdExamApplications.id, applicationId));

            if (result === "pass") {
                // Update student's main profile
                await tx
                    .update(phd)
                    .set({ hasPassedQe: true })
                    .where(eq(phd.email, application.studentEmail));

                // Create a To-do for the DRC member to set the qualification date
                await createTodos(
                    [
                        {
                            assignedTo: req.user!.email,
                            createdBy: req.user!.email,
                            title: `Set Qualification Date for ${application.studentEmail}`,
                            description: `The student ${application.studentEmail} has passed their qualifying exam. Please set their official qualification date.`,
                            module: "PhD Qe Application",
                            completionEvent: `set_qual_date_${application.studentEmail}`,
                        },
                    ],
                    tx
                );
            } else {
                // Increment attempt count on fail
                await tx
                    .update(phd)
                    .set({
                        qeAttemptCount: sql`${phd.qeAttemptCount} + 1`,
                    })
                    .where(eq(phd.email, application.studentEmail));
            }
        });

        res.status(200).json({
            success: true,
            message: "Result submitted successfully.",
        });
    })
);
