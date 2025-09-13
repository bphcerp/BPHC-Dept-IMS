import db from "@/config/db/index.ts";
import {
    phdProposals,
    phdProposalDacReviews,
    phdProposalCoSupervisors,
} from "@/config/db/schema/phd.ts";
import { files } from "@/config/db/schema/form.ts";
import { HttpCode, HttpError } from "@/config/errors.ts";
import { pdfUpload } from "@/config/multer.ts";
import { checkAccess } from "@/middleware/auth.ts";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import express from "express";
import { modules, phdSchemas } from "lib";
import multer from "multer";
import { createTodos, completeTodo } from "@/lib/todos/index.ts";
import { sendEmail } from "@/lib/common/email.ts";
import { eq, and } from "drizzle-orm";
import { phd } from "@/config/db/schema/admin.ts";

const router = express.Router();

router.post(
    "/:id",
    checkAccess(),
    asyncHandler((req, res, next) =>
        pdfUpload.fields(phdSchemas.phdProposalMulterFileFields)(
            req,
            res,
            (err) => {
                if (err instanceof multer.MulterError) {
                    throw new HttpError(HttpCode.BAD_REQUEST, err.message);
                }
                next(err);
            }
        )
    ),
    asyncHandler(async (req, res) => {
        const proposalId = parseInt(req.params.id);
        if (isNaN(proposalId)) {
            throw new HttpError(HttpCode.BAD_REQUEST, "Invalid proposal ID");
        }

        const {
            title,
            hasOutsideCoSupervisor,
            declaration,
            coSupervisorEmail,
            externalCoSupervisorEmail,
            externalCoSupervisorName,
        } = phdSchemas.phdProposalSubmissionSchema
            .omit({ proposalCycleId: true })
            .parse(req.body);

        const userEmail = req.user!.email;
        let supervisorEmail: string | null = null;
        let studentName: string | null = null;
        let facultyReviewDate: Date | null = null;

        await db.transaction(async (tx) => {
            const proposal = await tx.query.phdProposals.findFirst({
                where: and(
                    eq(phdProposals.id, proposalId),
                    eq(phdProposals.studentEmail, userEmail)
                ),
                with: {
                    student: true,
                    proposalSemester: true, 
                },
            });

            if (!proposal) {
                throw new HttpError(
                    HttpCode.NOT_FOUND,
                    "Proposal not found or you do not have permission to edit it."
                );
            }
            if (
                new Date(proposal.proposalSemester.studentSubmissionDate) <
                new Date()
            ) {
                throw new HttpError(
                    HttpCode.FORBIDDEN,
                    "The resubmission deadline for this cycle has passed."
                );
            }

            if (
                !["supervisor_revert", "drc_revert", "dac_revert"].includes(
                    proposal.status
                )
            ) {
                throw new HttpError(
                    HttpCode.BAD_REQUEST,
                    "This proposal cannot be resubmitted at its current stage."
                );
            }
            supervisorEmail = proposal.supervisorEmail;
            studentName = proposal.student.name;
            facultyReviewDate = proposal.proposalSemester.facultyReviewDate;

            const student = await tx.query.phd.findFirst({
                where: eq(phd.email, userEmail),
            });

            const insertedFileIds: Partial<
                Record<
                    (typeof phdSchemas.phdProposalFileFieldNames)[number],
                    number
                >
            > = {};

            if (req.files && Object.entries(req.files).length) {
                const fileInserts = Object.entries(req.files).map(
                    ([fieldName, files]) => {
                        const file = (files as Express.Multer.File[])[0];
                        return {
                            userEmail: req.user!.email,
                            filePath: file.path,
                            originalName: file.originalname,
                            mimetype: file.mimetype,
                            size: file.size,
                            fieldName,
                            module: modules[3],
                        };
                    }
                );
                const inserted = await tx
                    .insert(files)
                    .values(fileInserts)
                    .returning();
                inserted.forEach((file) => {
                    insertedFileIds[
                        file.fieldName as (typeof phdSchemas.phdProposalFileFieldNames)[number]
                    ] = file.id;
                });
            }

            if (proposal.status === "dac_revert") {
                await tx
                    .delete(phdProposalDacReviews)
                    .where(eq(phdProposalDacReviews.proposalId, proposalId));
            }

            await tx
                .update(phdProposals)
                .set({
                    title,
                    hasOutsideCoSupervisor,
                    declaration,
                    appendixFileId:
                        insertedFileIds.appendixFile ?? proposal.appendixFileId,
                    summaryFileId:
                        insertedFileIds.summaryFile ?? proposal.summaryFileId,
                    outlineFileId:
                        insertedFileIds.outlineFile ?? proposal.outlineFileId,
                    placeOfResearchFileId:
                        insertedFileIds.placeOfResearchFile ??
                        proposal.placeOfResearchFileId,
                    outsideCoSupervisorFormatFileId:
                        insertedFileIds.outsideCoSupervisorFormatFile ??
                        proposal.outsideCoSupervisorFormatFileId,
                    outsideSupervisorBiodataFileId:
                        insertedFileIds.outsideSupervisorBiodataFile ??
                        proposal.outsideSupervisorBiodataFileId,
                    status: "supervisor_review",
                    comments: null,
                    updatedAt: new Date(),
                })
                .where(eq(phdProposals.id, proposalId));

            const finalCoSupervisorEmail =
                coSupervisorEmail || externalCoSupervisorEmail;

            await tx
                .delete(phdProposalCoSupervisors)
                .where(eq(phdProposalCoSupervisors.proposalId, proposalId));
            if (finalCoSupervisorEmail) {
                await tx.insert(phdProposalCoSupervisors).values({
                    proposalId,
                    coSupervisorEmail: finalCoSupervisorEmail,
                    coSupervisorName: externalCoSupervisorName,
                });
            }

            await completeTodo(
                {
                    module: modules[3],
                    completionEvent: `proposal:student-resubmit:${proposalId}`,
                    assignedTo: userEmail,
                },
                tx
            );
        });

        if (supervisorEmail) {
            await createTodos([
                {
                    assignedTo: supervisorEmail,
                    createdBy: userEmail,
                    title: `Resubmitted PhD Proposal for ${studentName}`,
                    description: `Your student, ${studentName}, has resubmitted their PhD proposal for your review.`,
                    module: modules[3],
                    completionEvent: `proposal:supervisor-review:${proposalId}`,
                    link: `/phd/supervisor/proposal/${proposalId}`,
                    deadline: facultyReviewDate, 
                },
            ]);
            await sendEmail({
                to: supervisorEmail,
                subject: `Resubmitted PhD Proposal from ${studentName}`,
                html: `<p>Dear Supervisor,</p><p>Your student, ${studentName}, has resubmitted their PhD proposal titled "<strong>${title}</strong>".</p><p>Please log in to the portal to review the changes.</p>`,
            });
        }

        res.status(200).send({
            success: true,
            message: "Proposal resubmitted successfully",
        });
    })
);

export default router;
