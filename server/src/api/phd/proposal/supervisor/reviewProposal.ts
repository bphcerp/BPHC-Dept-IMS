import express from "express";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import { checkAccess } from "@/middleware/auth.ts";
import db from "@/config/db/index.ts";
import { phdProposals, phdProposalDacMembers } from "@/config/db/schema/phd.ts";
import { phdSchemas, modules } from "lib";
import { and, eq } from "drizzle-orm";
import { HttpError, HttpCode } from "@/config/errors.ts";
import z from "zod";
import { completeTodo, createTodos } from "@/lib/todos/index.ts";
import { sendEmail } from "@/lib/common/email.ts";
import { getUsersWithPermission } from "@/lib/common/index.ts";

const router = express.Router();

const reviewActionSchema = z.discriminatedUnion("action", [
    z.object({
        action: z.literal("accept"),
        ...phdSchemas.supervisorProposalAcceptSchema.shape,
    }),
    z.object({
        action: z.literal("revert"),
        ...phdSchemas.proposalRevertSchema.shape,
    }),
]);

export default router.post(
    "/:id",
    checkAccess(),
    asyncHandler(async (req, res) => {
        const proposalId = parseInt(req.params.id);
        if (isNaN(proposalId)) {
            throw new HttpError(HttpCode.BAD_REQUEST, "Invalid Proposal ID");
        }
        const body = reviewActionSchema.parse(req.body);

        await db.transaction(async (tx) => {
            const proposal = await tx.query.phdProposals.findFirst({
                where: and(
                    eq(phdProposals.id, proposalId),
                    eq(phdProposals.supervisorEmail, req.user!.email)
                ),
                with: { student: true, proposalSemester: true },
            });

            if (!proposal) {
                throw new HttpError(
                    HttpCode.NOT_FOUND,
                    "Proposal not found or you are not the supervisor."
                );
            }

            if (proposal.status !== "supervisor_review") {
                throw new HttpError(
                    HttpCode.BAD_REQUEST,
                    "Proposal is not in the supervisor review stage."
                );
            }

            await completeTodo(
                {
                    module: modules[3],
                    completionEvent: `proposal:supervisor-review:${proposalId}`,
                    assignedTo: req.user!.email,
                },
                tx
            );

            if (body.action === "revert") {
                await tx
                    .update(phdProposals)
                    .set({
                        status: "supervisor_revert",
                        comments: body.comments,
                    })
                    .where(eq(phdProposals.id, proposalId));
                await createTodos(
                    [
                        {
                            assignedTo: proposal.student.email,
                            createdBy: req.user!.email,
                            title: `Action Required: Your PhD Proposal has been reverted`,
                            description: `Your supervisor has requested revisions for your proposal. Please review the comments and resubmit.`,
                            module: modules[3],
                            completionEvent: `proposal:student-resubmit:${proposalId}`,
                            link: `/phd/phd-student/proposals`,
                        },
                    ],
                    tx
                );
                await sendEmail({
                    to: proposal.student.email,
                    subject: "Action Required: Your PhD Proposal Submission",
                    html: `<p>Dear ${
                        proposal.student.name || "Student"
                    },</p><p>Your supervisor has reviewed your PhD proposal and requires revisions. Please find the comments below:</p><blockquote>${
                        body.comments
                    }</blockquote><p>Please log in to the portal to make the necessary changes and resubmit.</p>`,
                });
            } else if (body.action === "accept") {
                await tx
                    .delete(phdProposalDacMembers)
                    .where(eq(phdProposalDacMembers.proposalId, proposalId));

                await tx.insert(phdProposalDacMembers).values(
                    body.dacMembers.map((email) => ({
                        proposalId,
                        dacMemberEmail: email,
                    }))
                );

                await tx
                    .update(phdProposals)
                    .set({
                        status: "drc_review",
                        comments: body.comments ?? null,
                    })
                    .where(eq(phdProposals.id, proposalId));

                const drcConveners = await getUsersWithPermission(
                    "phd:drc:proposal",
                    tx
                );
                if (drcConveners.length > 0) {
                    await createTodos(
                        drcConveners.map((drc) => ({
                            module: modules[3],
                            assignedTo: drc.email,
                            createdBy: req.user!.email,
                            title: "PhD Proposal Ready for DRC Review",
                            description: `Proposal by ${proposal.student.name} is approved by the supervisor and is awaiting your review.`,
                            link: `/phd/drc-convenor/proposal-management/${proposalId}`,
                            completionEvent: `proposal:drc-review:${proposalId}`,
                            deadline: proposal.proposalSemester?.drcReviewDate,
                        })),
                        tx
                    );
                    await Promise.all(
                        drcConveners.map((drc) =>
                            sendEmail({
                                to: drc.email,
                                subject: `PhD Proposal from ${proposal.student.name} requires DRC review`,
                                html: `<p>Dear DRC Convenor,</p><p>A PhD proposal submitted by ${proposal.student.name} has been approved by their supervisor and is now ready for your review.</p><p>Please log in to the portal to take action.</p>`,
                            })
                        )
                    );
                }
            }
        });

        res.status(200).json({
            success: true,
            message: `Proposal ${body.action}ed successfully.`,
        });
    })
);
