// server/src/api/phd/proposal/drcConvener/reviewProposal.ts
import express from "express";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import { checkAccess } from "@/middleware/auth.ts";
import db from "@/config/db/index.ts";
import { phdProposals, phdProposalDacMembers } from "@/config/db/schema/phd.ts";
import { phdSchemas, modules } from "lib";
import { and, eq, inArray } from "drizzle-orm";
import { HttpCode, HttpError } from "@/config/errors.ts";
import z from "zod";
import { completeTodo, createTodos } from "@/lib/todos/index.ts";
import { sendEmail } from "@/lib/common/email.ts"; // Added sendBulkEmails
import assert from "assert";

const router = express.Router();

const reviewActionSchema = z.discriminatedUnion("action", [
    z.object({
        action: z.literal("accept"),
        ...phdSchemas.drcProposalAcceptSchema.shape,
    }),
    z.object({
        action: z.literal("revert"),
        ...phdSchemas.proposalRevertSchema.shape,
    }),
    z.object({
        action: z.literal("reject"),
        ...phdSchemas.drcProposalRejectSchema.shape,
    }),
]);

export default router.post(
    "/:id",
    checkAccess(),
    asyncHandler(async (req, res) => {
        assert(req.user, "User must be authenticated");
        const proposalId = parseInt(req.params.id);
        if (isNaN(proposalId)) {
            throw new HttpError(HttpCode.BAD_REQUEST, "Invalid Proposal ID");
        }

        const body = reviewActionSchema.parse(req.body);

        await db.transaction(async (tx) => {
            const proposal = await tx.query.phdProposals.findFirst({
                where: eq(phdProposals.id, proposalId),
                with: {
                    dacMembers: true,
                    student: true,
                    proposalSemester: true,
                },
            });

            if (!proposal) {
                throw new HttpError(HttpCode.NOT_FOUND, "Proposal not found.");
            }

            if (
                new Date(proposal.proposalSemester.drcReviewDate) < new Date()
            ) {
                // Allow rejection even after deadline
                if (body.action !== "reject") {
                    throw new HttpError(
                        HttpCode.FORBIDDEN,
                        "The deadline for DRC review has passed."
                    );
                }
            }

            // Determine the current state's completion event for ToDo completion
            let completionEventForCurrentState: string | null = null;
            if (proposal.status === "drc_review") {
                completionEventForCurrentState = `proposal:drc-review:${proposalId}`;
            }
            // Add other potential states from which rejection might occur if needed
            // else if (proposal.status === "some_other_state") { ... }

            if (proposal.status !== "drc_review") {
                // Allow rejection from other states if needed, otherwise restrict
                if (body.action !== "reject") {
                    throw new HttpError(
                        HttpCode.BAD_REQUEST,
                        `Proposal is not in the DRC review stage (current: ${proposal.status}).`
                    );
                }
                // Allow rejection to proceed even if not in drc_review
            }

            // Complete relevant To-Do only if an event was identified
            if (completionEventForCurrentState) {
                await completeTodo(
                    {
                        module: modules[3],
                        completionEvent: completionEventForCurrentState,
                        assignedTo: req.user!.email, // Assuming DRC convenor is the assignee
                    },
                    tx
                );
            }

            if (body.action === "revert") {
                await tx
                    .update(phdProposals)
                    .set({ status: "drc_revert", comments: body.comments })
                    .where(eq(phdProposals.id, proposalId));

                await createTodos(
                    [
                        {
                            assignedTo: proposal.student.email,
                            createdBy: req.user!.email,
                            title: "Action Required: PhD Proposal Reverted by DRC",
                            description: `The DRC has requested revisions for your proposal. Please review comments and resubmit. Comments: ${body.comments}`,
                            module: modules[3],
                            completionEvent: `proposal:student-resubmit:${proposalId}`,
                            link: "/phd/phd-student/proposals",
                        },
                    ],
                    tx
                );

                await sendEmail({
                    to: proposal.student.email,
                    subject: "Action Required: PhD Proposal Reverted by DRC",
                    html: `<p>Dear ${proposal.student.name ?? "Student"},</p><p>The DRC has reviewed your proposal and requires revisions. Comments: <blockquote>${body.comments}</blockquote></p><p>Please log in to resubmit.</p>`,
                });

                await sendEmail({
                    to: proposal.supervisorEmail,
                    subject: `PhD Proposal for ${proposal.student.name} Reverted by DRC`,
                    html: `<p>Dear Supervisor,</p><p>The DRC has reverted the proposal for your student, <strong>${proposal.student.name}</strong>, with the following comments:</p><blockquote>${body.comments}</blockquote><p>The student has been asked to make the necessary revisions and resubmit.</p>`,
                });
            } else if (body.action === "accept") {
                // Handle DAC member updates
                const currentDacEmails = proposal.dacMembers.map(
                    (m) => m.dacMemberEmail
                );
                const emailsToDelete = currentDacEmails.filter(
                    (email) => !body.selectedDacMembers.includes(email)
                );
                if (emailsToDelete.length > 0) {
                    await tx
                        .delete(phdProposalDacMembers)
                        .where(
                            and(
                                eq(
                                    phdProposalDacMembers.proposalId,
                                    proposalId
                                ),
                                inArray(
                                    phdProposalDacMembers.dacMemberEmail,
                                    emailsToDelete
                                )
                            )
                        );
                }

                // Update proposal status
                await tx
                    .update(phdProposals)
                    .set({
                        status: "dac_review",
                        comments: body.comments ?? null,
                    })
                    .where(eq(phdProposals.id, proposalId));

                // Create To-Dos for selected DAC members
                await createTodos(
                    body.selectedDacMembers.map((dacEmail) => ({
                        assignedTo: dacEmail,
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

                // Send emails to selected DAC members
                await Promise.all(
                    body.selectedDacMembers.map((dacEmail) =>
                        sendEmail({
                            to: dacEmail,
                            subject: `PhD Proposal Evaluation Required for ${proposal.student.name}`,
                            html: `<p>Dear DAC Member,</p><p>You have been assigned to evaluate the PhD proposal for ${proposal.student.name}. Please log in to the portal to submit your review.</p>`,
                        })
                    )
                );
            } else if (body.action === "reject") {
                // Set status to 'rejected' and add comments
                await tx
                    .update(phdProposals)
                    .set({ status: "rejected", comments: body.comments })
                    .where(eq(phdProposals.id, proposalId));

                // Complete any potential To-Do for the supervisor if rejected before their review
                // (This assumes rejection might happen even before supervisor review in some edge cases)
                await completeTodo(
                    {
                        module: modules[3],
                        completionEvent: `proposal:supervisor-review:${proposalId}`,
                        // No specific assignee needed if just clearing based on event
                    },
                    tx
                );

                // Send email to student
                await sendEmail({
                    to: proposal.student.email,
                    subject: "PhD Proposal Update",
                    html: `<p>Dear ${proposal.student.name ?? "Student"},</p><p>Your PhD proposal titled "${proposal.title}" has been reviewed by the DRC Convenor.</p><p>Unfortunately, it has been rejected from the current process with the following comments:</p><blockquote>${body.comments}</blockquote><p>Please contact the DRC Convenor or your supervisor for further guidance.</p>`,
                });

                // Send email to supervisor
                await sendEmail({
                    to: proposal.supervisorEmail,
                    subject: `PhD Proposal Update for ${proposal.student.name}`,
                    html: `<p>Dear Supervisor,</p><p>The PhD proposal titled "${proposal.title}" submitted by your student, <strong>${proposal.student.name}</strong>, has been reviewed by the DRC Convenor.</p><p>It has been rejected from the current process with the following comments:</p><blockquote>${body.comments}</blockquote><p>Please advise the student on the next steps.</p>`,
                });
            }
        });

        res.status(200).json({
            success: true,
            message: `Proposal ${body.action}ed successfully.`,
        });
    })
);
