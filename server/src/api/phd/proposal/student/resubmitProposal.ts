import db from "@/config/db/index.ts";
import {
    phdProposals,
    phdProposalCoSupervisors,
    phdProposalDacReviews,
} from "@/config/db/schema/phd.ts";
import { files } from "@/config/db/schema/form.ts";
import { HttpCode, HttpError } from "@/config/errors.ts";
import { pdfUpload } from "@/config/multer.ts";
import { checkAccess } from "@/middleware/auth.ts";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import express from "express";
import { modules, phdSchemas } from "lib";
import multer from "multer";
import { createTodos } from "@/lib/todos/index.ts";
import { eq, and } from "drizzle-orm";

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

        const { title } = phdSchemas.phdProposalSubmissionSchema.parse(
            req.body
        );
        const userEmail = req.user!.email;

        if (
            Array.isArray(req.files) ||
            !req.files?.abstractFile ||
            !req.files?.proposalFile
        ) {
            throw new HttpError(
                HttpCode.BAD_REQUEST,
                "Both abstract and proposal files are required for resubmission."
            );
        }

        await db.transaction(async (tx) => {
            const proposal = await tx.query.phdProposals.findFirst({
                where: and(
                    eq(phdProposals.id, proposalId),
                    eq(phdProposals.studentEmail, userEmail)
                ),
                with: { student: true },
            });

            if (!proposal) {
                throw new HttpError(
                    HttpCode.NOT_FOUND,
                    "Proposal not found or you do not have permission to edit it."
                );
            }
            if (proposal.status !== "dac_rejected") {
                throw new HttpError(
                    HttpCode.BAD_REQUEST,
                    "This proposal cannot be resubmitted at its current stage."
                );
            }

            // 1. Upload new files
            const insertedFileIds: { [key: string]: number } = {};
            if (
                !Array.isArray(req.files) &&
                req.files &&
                Object.entries(req.files).length
            ) {
                const insertedFiles = await tx
                    .insert(files)
                    .values(
                        Object.entries(req.files).map(([fieldName, files]) => {
                            const file = files[0];
                            return {
                                userEmail: req.user!.email,
                                filePath: file.path,
                                originalName: file.originalname,
                                mimetype: file.mimetype,
                                size: file.size,
                                fieldName,
                                module: modules[3],
                            };
                        })
                    )
                    .returning();
                insertedFiles.forEach((file) => {
                    insertedFileIds[file.fieldName!] = file.id;
                });
            }

            // 2. Clear old reviews
            await tx
                .delete(phdProposalCoSupervisors)
                .where(eq(phdProposalCoSupervisors.proposalId, proposalId));
            await tx
                .delete(phdProposalDacReviews)
                .where(eq(phdProposalDacReviews.proposalId, proposalId));

            // 3. Update the proposal to start the review process again
            await tx
                .update(phdProposals)
                .set({
                    title,
                    abstractFileId: insertedFileIds["abstractFile"],
                    proposalFileId: insertedFileIds["proposalFile"],
                    status: "supervisor_review",
                    comments: null, // Clear old rejection comments
                    updatedAt: new Date(),
                })
                .where(eq(phdProposals.id, proposalId));

            // 4. Notify supervisor again
            await createTodos(
                [
                    {
                        module: modules[3],
                        assignedTo: proposal.supervisorEmail,
                        createdBy: userEmail,
                        title: `Resubmitted PhD Proposal by ${proposal.student.name}`,
                        description: `A PhD proposal by ${
                            proposal.student.name ?? "Student"
                        } has been resubmitted and is pending your review.`,
                        link: `/phd/supervisor/proposal/${proposal.id}`,
                        completionEvent: `proposal:supervisor-review:${proposal.id}`,
                    },
                ],
                tx
            );
        });

        res.status(200).send({
            success: true,
            message: "Proposal resubmitted successfully",
        });
    })
);

export default router;
