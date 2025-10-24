import db from "@/config/db/index.ts";
import {
    phdProposals,
    phdProposalDacReviews,
    phdProposalCoSupervisors,
} from "@/config/db/schema/phd.ts";
import { files } from "@/config/db/schema/form.ts";
import { HttpCode, HttpError } from "@/config/errors.ts";
import { pdfUpload, pdfLimits } from "@/config/multer.ts";
import { checkAccess } from "@/middleware/auth.ts";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import express from "express";
import { modules, phdSchemas } from "lib";
import multer from "multer";
import { createTodos, completeTodo } from "@/lib/todos/index.ts";
import { sendEmail } from "@/lib/common/email.ts";
import { eq, and } from "drizzle-orm";
import env from "@/config/environment.ts";
import logger from "@/config/logger.ts";
import { ZodError } from "zod";
import { fromError } from "zod-validation-error";

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
                    logger.error(
                        `Multer error for proposal ${req.params.id}: ${err.message}`,
                        { code: err.code, field: err.field }
                    );
                    let userMessage = "File upload error.";
                    if (err.code === "LIMIT_FILE_SIZE") {
                        userMessage = `File too large. Maximum size is ${
                            pdfLimits?.fileSize
                                ? (pdfLimits.fileSize / 1024 / 1024).toFixed(
                                      1
                                  ) + "MB"
                                : "unknown"
                        }.`;
                    } else if (err.code === "LIMIT_UNEXPECTED_FILE") {
                        userMessage = `Unexpected file field: ${err.field}. Please check uploaded files.`;
                    }
                    return next(
                        new HttpError(HttpCode.BAD_REQUEST, userMessage)
                    );
                } else if (err) {
                    logger.error(
                        `Non-multer error during file upload for proposal ${req.params.id}:`,
                        err
                    );
                    return next(
                        new HttpError(
                            HttpCode.INTERNAL_SERVER_ERROR,
                            "An unexpected error occurred during file upload."
                        )
                    );
                }
                next();
            }
        )
    ),
    asyncHandler(async (req, res, next) => {
        const proposalId = parseInt(req.params.id);
        if (isNaN(proposalId)) {
            return next(
                new HttpError(HttpCode.BAD_REQUEST, "Invalid proposal ID")
            );
        }

        logger.info(`Received resubmit request for proposal ID: ${proposalId}`);
        logger.debug("Raw req.body:", req.body);
        if (req.files) {
            logger.debug("Received files:", Object.keys(req.files));
        } else {
            logger.debug("No files received in req.files");
        }

        let parsedBody;
        try {
            parsedBody = phdSchemas.phdProposalSubmissionSchema
                .omit({ proposalCycleId: true })
                .parse(req.body);
        } catch (error) {
            if (error instanceof ZodError) {
                const validationError = fromError(error);
                logger.error(
                    `Zod validation failed for proposal ${proposalId}: ${validationError.message}`,
                    error.issues
                );
                return next(
                    new HttpError(
                        HttpCode.BAD_REQUEST,
                        `Validation Error: ${validationError.message}`
                    )
                );
            } else {
                logger.error(
                    `Unexpected error during body parsing for proposal ${proposalId}:`,
                    error
                );
                return next(
                    new HttpError(
                        HttpCode.INTERNAL_SERVER_ERROR,
                        "Error processing request data."
                    )
                );
            }
        }

        const {
            title,
            hasOutsideCoSupervisor,
            declaration,
            submissionType,
            internalCoSupervisors,
            externalCoSupervisors,
        } = parsedBody;

        const userEmail = req.user!.email;
        let supervisorEmail: string | null = null;
        let studentName: string | null = null;
        let facultyReviewDate: Date | null = null;

        if (submissionType === "final" && !declaration) {
            return next(
                new HttpError(
                    HttpCode.BAD_REQUEST,
                    "You must accept the declaration to submit."
                )
            );
        }

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

            const allowedStatuses = [
                "draft",
                "supervisor_revert",
                "drc_revert",
                "dac_revert",
            ];
            if (!allowedStatuses.includes(proposal.status)) {
                throw new HttpError(
                    HttpCode.BAD_REQUEST,
                    "This proposal cannot be resubmitted at its current stage."
                );
            }

            // Deadline check only for 'draft' status
            if (proposal.status === "draft") {
                if (
                    new Date(proposal.proposalSemester.studentSubmissionDate) <
                    new Date()
                ) {
                    throw new HttpError(
                        HttpCode.FORBIDDEN,
                        "The submission deadline for this cycle has passed."
                    );
                }
            }

            supervisorEmail = proposal.supervisorEmail;
            studentName = proposal.student.name;
            facultyReviewDate = proposal.proposalSemester.facultyReviewDate;

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

            // *** CORRECTED STATUS LOGIC ***
            let nextStatus: (typeof phdSchemas.phdProposalStatuses)[number];

            if (submissionType === "final") {
                // If submitting, always go to supervisor review
                nextStatus = "supervisor_review";
            } else {
                // If saving as draft, *keep* the current status if it's a revert status,
                // otherwise (if it was 'draft' already) keep it as 'draft'.
                nextStatus =
                    proposal.status === "draft" ? "draft" : proposal.status;
            }
            // *** END OF CORRECTION ***

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
                    status: nextStatus,
                    comments:
                        nextStatus === "supervisor_review"
                            ? null
                            : proposal.comments, // Clear comments only on final submit
                    updatedAt: new Date(),
                })
                .where(eq(phdProposals.id, proposalId));

            await tx
                .delete(phdProposalCoSupervisors)
                .where(eq(phdProposalCoSupervisors.proposalId, proposalId));

            const coSupervisorsToInsert = [];
            if (internalCoSupervisors) {
                coSupervisorsToInsert.push(
                    ...internalCoSupervisors.map((email) => ({
                        proposalId,
                        coSupervisorEmail: email,
                    }))
                );
            }
            if (externalCoSupervisors) {
                coSupervisorsToInsert.push(
                    ...externalCoSupervisors.map((ext) => ({
                        proposalId,
                        coSupervisorEmail: ext.email,
                        coSupervisorName: ext.name,
                    }))
                );
            }
            if (coSupervisorsToInsert.length > 0) {
                await tx
                    .insert(phdProposalCoSupervisors)
                    .values(coSupervisorsToInsert);
            }

            // Only complete the todo if it's a *final* submission
            if (submissionType === "final") {
                await completeTodo(
                    {
                        module: modules[3],
                        completionEvent: `proposal:student-resubmit:${proposalId}`,
                        assignedTo: userEmail,
                    },
                    tx
                );
            }
        });

        if (supervisorEmail && submissionType === "final") {
            await createTodos([
                {
                    assignedTo: supervisorEmail,
                    createdBy: userEmail,
                    title: `Resubmitted PhD Proposal for ${studentName || userEmail}`,
                    description: `Your student, ${
                        studentName || userEmail
                    }, has resubmitted their PhD proposal titled "${title}" for your review.`,
                    module: modules[3],
                    completionEvent: `proposal:supervisor-review:${proposalId}`,
                    link: `/phd/supervisor/proposal/${proposalId}`,
                    deadline: facultyReviewDate,
                },
            ]);
            await sendEmail({
                to: supervisorEmail,
                subject: `Resubmitted PhD Proposal from ${studentName || userEmail}`,
                text: `Dear Supervisor,\n\nYour student, ${
                    studentName || userEmail
                }, has resubmitted their PhD proposal titled "${title}".\n\nPlease log in to the portal (${
                    env.FRONTEND_URL
                }) to review the changes.`,
            });
        }
        res.status(200).send({
            success: true,
            message: `Proposal ${
                submissionType === "draft"
                    ? "draft saved"
                    : "resubmitted successfully"
            }.`,
        });
    })
);

export default router;
