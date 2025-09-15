import db from "@/config/db/index.ts";
import {
    phdProposals,
    phdProposalDacReviews,
    phdProposalDacReviewForms,
} from "@/config/db/schema/phd.ts";
import { files } from "@/config/db/schema/form.ts";
import { HttpCode, HttpError } from "@/config/errors.ts";
import { checkAccess } from "@/middleware/auth.ts";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import express from "express";
import { phdSchemas, modules } from "lib";
import { pdfUpload } from "@/config/multer.ts";
import multer from "multer";
import { eq } from "drizzle-orm";
import { completeTodo, createTodos } from "@/lib/todos/index.ts";
import { sendEmail } from "@/lib/common/email.ts";
import { getUsersWithPermission } from "@/lib/common/index.ts";

const router = express.Router();

router.post(
    "/:id",
    checkAccess(),
    asyncHandler((req, res, next) =>
        pdfUpload.single("feedbackFile")(req, res, (err) => {
            if (err instanceof multer.MulterError) {
                throw new HttpError(HttpCode.BAD_REQUEST, err.message);
            }
            next(err);
        })
    ),
    asyncHandler(async (req, res) => {
        const proposalId = parseInt(req.params.id);
        if (isNaN(proposalId))
            throw new HttpError(HttpCode.BAD_REQUEST, "Invalid proposal ID");
        const { approved, comments, evaluation } =
            phdSchemas.submitDacReviewSchema.parse(req.body);
        const dacMemberEmail = req.user!.email;
        const feedbackFile = req.file;
        await db.transaction(async (tx) => {
            const proposal = await tx.query.phdProposals.findFirst({
                where: (cols, { eq }) => eq(cols.id, proposalId),
                with: {
                    dacMembers: true,
                    student: true,
                    proposalSemester: true,
                },
            });
            if (!proposal)
                throw new HttpError(HttpCode.NOT_FOUND, "Proposal not found");
            if (
                new Date(proposal.proposalSemester.dacReviewDate) < new Date()
            ) {
                throw new HttpError(
                    HttpCode.FORBIDDEN,
                    "The deadline for DAC review has passed."
                );
            }
            if (proposal.status !== "dac_review")
                throw new HttpError(
                    HttpCode.BAD_REQUEST,
                    "Proposal is not in DAC review stage"
                );
            const isDacMember = proposal.dacMembers.some(
                (m) => m.dacMemberEmail === dacMemberEmail
            );
            if (!isDacMember)
                throw new HttpError(
                    HttpCode.FORBIDDEN,
                    "You are not assigned to review this proposal."
                );
            let feedbackFileId: number | null = null;
            if (feedbackFile) {
                const [insertedFile] = await tx
                    .insert(files)
                    .values({
                        userEmail: dacMemberEmail,
                        filePath: feedbackFile.path,
                        originalName: feedbackFile.originalname,
                        mimetype: feedbackFile.mimetype,
                        size: feedbackFile.size,
                        fieldName: "feedbackFile",
                        module: modules[3],
                    })
                    .returning();
                feedbackFileId = insertedFile.id;
            }
            const [review] = await tx
                .insert(phdProposalDacReviews)
                .values({
                    proposalId,
                    dacMemberEmail,
                    approved,
                    comments,
                    feedbackFileId,
                })
                .returning();
            await tx
                .insert(phdProposalDacReviewForms)
                .values({ reviewId: review.id, formData: evaluation });
            await completeTodo(
                {
                    module: modules[3],
                    completionEvent: `proposal:dac-review:${proposalId}`,
                    assignedTo: dacMemberEmail,
                },
                tx
            );
            const allReviews = await tx.query.phdProposalDacReviews.findMany({
                where: (cols, { eq }) => eq(cols.proposalId, proposalId),
            });
            if (allReviews.length === proposal.dacMembers.length) {
                const allApproved = allReviews.every((r) => r.approved);
                const newStatus = allApproved ? "dac_accepted" : "dac_revert";
                const newComments = !allApproved ? "DAC_REVERT_FLAG" : null;
                await tx
                    .update(phdProposals)
                    .set({ status: newStatus, comments: newComments })
                    .where(eq(phdProposals.id, proposalId));
                if (allApproved) {
                    const drcConveners = await getUsersWithPermission(
                        "phd:drc:proposal",
                        tx
                    );
                    await createTodos(
                        drcConveners.map((drc) => ({
                            assignedTo: drc.email,
                            createdBy: req.user!.email,
                            title: `Set Seminar Details for ${proposal.student.name}'s Proposal`,
                            description: `The DAC has approved the proposal for ${proposal.student.name}. Please set the seminar details.`,
                            module: modules[3],
                            completionEvent: `proposal:set-seminar-details:${proposalId}`,
                            link: `/phd/drc-convenor/proposal-management/${proposalId}`,
                        })),
                        tx
                    );
                    await Promise.all(
                        drcConveners.map((drc) =>
                            sendEmail({
                                to: drc.email,
                                subject: `PhD Proposal Approved for ${proposal.student.name}`,
                                text: `Dear DRC Convenor,\n\nThe DAC has approved the proposal for ${proposal.student.name}. Please log in to the portal to set the seminar details.`,
                            })
                        )
                    );
                } else {
                    const studentRevertComments = allReviews
                        .filter((r) => !r.approved)
                        .map((r) => `- ${r.dacMemberEmail}: ${r.comments}`)
                        .join("\n");
                    await createTodos(
                        [
                            {
                                assignedTo: proposal.student.email,
                                createdBy: req.user!.email,
                                title: "Action Required: PhD Proposal Reverted by DAC",
                                description:
                                    "The DAC has requested revisions for your proposal. Please review comments and resubmit.",
                                module: modules[3],
                                completionEvent: `proposal:student-resubmit:${proposalId}`,
                                link: "/phd/phd-student/proposals",
                            },
                        ],
                        tx
                    );
                    await sendEmail({
                        to: proposal.student.email,
                        subject:
                            "Action Required: PhD Proposal Reverted by DAC",
                        text: `Dear ${proposal.student.name},\n\nThe DAC has reviewed your proposal and requires revisions. Comments from the committee:\n${studentRevertComments}\n\nPlease log in to resubmit.`,
                    });
                    await sendEmail({
                        to: proposal.supervisorEmail,
                        subject: `PhD Proposal for ${proposal.student.name} Reverted by DAC`,
                        text: `Dear Supervisor,\n\nThe DAC has reverted the proposal for your student, ${proposal.student.name}. The student has been notified to make revisions and resubmit.\n\nComments from the committee:\n${studentRevertComments}`,
                    });
                }
            }
        });
        res.status(200).json({ success: true, message: "Review submitted." });
    })
);

export default router;
