import express from "express";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import { checkAccess } from "@/middleware/auth.ts";
import db from "@/config/db/index.ts";
import { phdProposals, phdProposalDacMembers } from "@/config/db/schema/phd.ts";
import { phdSchemas, modules } from "lib";
import { and, eq } from "drizzle-orm";
import { HttpCode, HttpError } from "@/config/errors.ts";
import z from "zod";
import { completeTodo, createTodos } from "@/lib/todos/index.ts";
import { sendEmail } from "@/lib/common/email.ts";
import { getUsersWithPermission } from "@/lib/common/index.ts";

const router = express.Router();

// Simplified schema, no more "forward" action
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
                with: {
                    student: true,
                    proposalSemester: true,
                    dacMembers: true,
                },
            });

            if (!proposal) {
                throw new HttpError(
                    HttpCode.NOT_FOUND,
                    "Proposal not found or you are not the supervisor."
                );
            }
            if (
                new Date(proposal.proposalSemester.facultyReviewDate) <
                new Date()
            ) {
                throw new HttpError(
                    HttpCode.FORBIDDEN,
                    "The deadline for supervisor review has passed."
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
                    text: `Dear ${
                        proposal.student.name || "Student"
                    },\n\nYour supervisor has reviewed your PhD proposal and requires revisions. Please find the comments below:\n\n${
                        body.comments
                    }\n\nPlease log in to the portal to make the necessary changes and resubmit.`,
                });
            } else if (body.action === "accept") {
                const currentDacEmails = proposal.dacMembers
                    .map((m) => m.dacMemberEmail)
                    .sort();
                const newDacEmails = body.dacMembers.map((m) => m.email).sort();

                const dacMembersChanged =
                    currentDacEmails.length !== newDacEmails.length ||
                    currentDacEmails.some(
                        (email, i) => email !== newDacEmails[i]
                    );

                const wasPreviouslySubmitted = proposal.dacMembers.length > 0;

                let nextStatus: (typeof phdSchemas.phdProposalStatuses)[number] =
                    "drc_review";

                // THIS IS THE RESTORED LOGIC: If DAC existed and hasn't changed, skip DRC
                if (wasPreviouslySubmitted && !dacMembersChanged) {
                    nextStatus = "dac_review";
                }

                // Always update the DAC members in the DB on accept
                await tx
                    .delete(phdProposalDacMembers)
                    .where(eq(phdProposalDacMembers.proposalId, proposalId));
                await tx.insert(phdProposalDacMembers).values(
                    body.dacMembers.map((member) => ({
                        proposalId,
                        dacMemberEmail: member.email,
                        dacMemberName: member.name,
                    }))
                );

                await tx
                    .update(phdProposals)
                    .set({
                        status: nextStatus,
                        comments: body.comments ?? null,
                    })
                    .where(eq(phdProposals.id, proposalId));

                // Send notifications based on the determined nextStatus
                if (nextStatus === "drc_review") {
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
                                deadline:
                                    proposal.proposalSemester?.drcReviewDate,
                            })),
                            tx
                        );
                        await Promise.all(
                            drcConveners.map((drc) =>
                                sendEmail({
                                    to: drc.email,
                                    subject: `PhD Proposal from ${proposal.student.name} requires DRC review`,
                                    text: `Dear DRC Convenor,\n\nA PhD proposal submitted by ${proposal.student.name} has been approved by their supervisor and is now ready for your review.\n\nPlease log in to the portal to take action.`,
                                })
                            )
                        );
                    }
                } else {
                    // This block runs if nextStatus is 'dac_review'
                    await createTodos(
                        body.dacMembers.map((dacMember) => ({
                            assignedTo: dacMember.email,
                            createdBy: req.user!.email,
                            title: `PhD Proposal Evaluation Required for ${proposal.student.name}`,
                            description: `Please evaluate the PhD proposal for ${proposal.student.name}.`,
                            module: modules[3],
                            completionEvent: `proposal:dac-review:${proposalId}`,
                            link: `/phd/dac/proposals/${proposalId}`,
                            deadline: proposal.proposalSemester?.dacReviewDate,
                        })),
                        tx
                    );
                    await Promise.all(
                        body.dacMembers.map((dacMember) =>
                            sendEmail({
                                to: dacMember.email,
                                subject: `PhD Proposal Evaluation Required for ${proposal.student.name}`,
                                text: `Dear DAC Member,\n\nYou have been assigned to evaluate the PhD proposal for ${proposal.student.name}. Please log in to the portal to submit your review.`,
                            })
                        )
                    );
                }
            }
        });

        res.status(200).json({
            success: true,
            message: `Proposal ${
                body.action === "revert" ? "reverted" : "processed"
            } successfully.`,
        });
    })
);
