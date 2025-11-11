// server/src/api/phd/proposal/supervisor/reviewProposal.ts
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
import { sendEmail, sendBulkEmails } from "@/lib/common/email.ts"; // Ensure sendBulkEmails is imported
import { getUsersWithPermission } from "@/lib/common/index.ts";
import environment from "@/config/environment.ts"; // Import environment for frontend URL

const router = express.Router();

// Schema remains the same (accept or revert)
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
    checkAccess(), // Assuming appropriate permission like 'phd:faculty:proposal'
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
                    eq(phdProposals.supervisorEmail, req.user!.email) // Ensure it's the correct supervisor
                ),
                with: {
                    student: true,
                    proposalSemester: true,
                    dacMembers: true, // Needed to check if DAC members changed
                },
            });

            if (!proposal) {
                throw new HttpError(
                    HttpCode.NOT_FOUND,
                    "Proposal not found or you are not the supervisor."
                );
            }
            // Check deadline
            if (
                new Date(proposal.proposalSemester.facultyReviewDate) <
                new Date()
            ) {
                throw new HttpError(
                    HttpCode.FORBIDDEN,
                    "The deadline for supervisor review has passed."
                );
            }
            // Check current status
            if (proposal.status !== "supervisor_review") {
                throw new HttpError(
                    HttpCode.BAD_REQUEST,
                    "Proposal is not in the supervisor review stage."
                );
            }

            // Complete the supervisor's To-Do for reviewing this proposal
            await completeTodo(
                {
                    module: modules[3], // PhD Proposal module
                    completionEvent: `proposal:supervisor-review:${proposalId}`,
                },
                tx
            );

            // --- Handle Revert Action ---
            if (body.action === "revert") {
                await tx
                    .update(phdProposals)
                    .set({
                        status: "supervisor_revert", // Specific revert status
                        comments: body.comments,
                    })
                    .where(eq(phdProposals.id, proposalId));

                // Create To-Do for the student
                await createTodos(
                    [
                        {
                            assignedTo: proposal.student.email,
                            createdBy: req.user!.email,
                            title: `Action Required: Your PhD Proposal has been reverted`,
                            description: `Your supervisor has requested revisions for your proposal. Please review the comments and resubmit. Comments: ${body.comments}`,
                            module: modules[3],
                            completionEvent: `proposal:student-resubmit:${proposalId}`, // Specific event for student resubmission
                            link: `/phd/phd-student/proposals`, // Link to student's proposal page
                        },
                    ],
                    tx
                );

                // Send email notification to the student
                await sendEmail({
                    to: proposal.student.email,
                    subject: "Action Required: Your PhD Proposal Submission",
                    text: `Dear ${
                        proposal.student.name || "Student"
                    },\n\nYour supervisor has reviewed your PhD proposal and requires revisions. Please find the comments below:\n\n${
                        body.comments
                    }\n\nPlease log in to the portal to make the necessary changes and resubmit.`,
                });

                // --- Handle Accept Action ---
            } else if (body.action === "accept") {
                // Determine if this is a resubmission after DAC revert
                const isPostDacRevert = (proposal.comments ?? "").includes(
                    "DAC_REVERT_FLAG"
                );

                // Compare current DAC members with newly submitted ones
                const currentDacEmails = proposal.dacMembers
                    .map((m) => m.dacMemberEmail)
                    .sort();
                const newDacEmails = body.dacMembers.map((m) => m.email).sort();

                const dacMembersChanged =
                    currentDacEmails.length !== newDacEmails.length ||
                    currentDacEmails.some(
                        (email, i) => email !== newDacEmails[i]
                    );

                // Determine the next status based on the workflow logic
                let nextStatus: (typeof phdSchemas.phdProposalStatuses)[number] =
                    "drc_review"; // Default: Go to DRC review

                if (isPostDacRevert && !dacMembersChanged) {
                    // If DAC reverted, and supervisor *didn't* change DAC members, skip DRC
                    nextStatus = "dac_review";
                }

                // Update DAC members in the database (always overwrite on accept)
                await tx
                    .delete(phdProposalDacMembers)
                    .where(eq(phdProposalDacMembers.proposalId, proposalId));
                await tx.insert(phdProposalDacMembers).values(
                    body.dacMembers.map((member) => ({
                        proposalId,
                        dacMemberEmail: member.email,
                        dacMemberName: member.name, // Store external name if provided
                    }))
                );

                // Update the proposal status and clear comments (or set new ones)
                await tx
                    .update(phdProposals)
                    .set({
                        status: nextStatus,
                        comments: body.comments ?? null, // Store supervisor's optional comments
                    })
                    .where(eq(phdProposals.id, proposalId));

                // --- Send Notifications based on nextStatus ---

                // Scenario 1: Needs DRC Review
                if (nextStatus === "drc_review") {
                    const drcConveners = await getUsersWithPermission(
                        "phd:drc:proposal", // Permission for DRC Convenor role
                        tx
                    );
                    if (drcConveners.length > 0) {
                        // Create To-Dos for DRC Convenors
                        await createTodos(
                            drcConveners.map((drc) => ({
                                module: modules[3],
                                assignedTo: drc.email,
                                createdBy: req.user!.email,
                                title: "PhD Proposal Ready for DRC Review",
                                description: `Proposal by ${proposal.student.name} is approved by the supervisor and is awaiting your review to finalize DAC members.`,
                                link: `/phd/drc-convenor/proposal-management/${proposalId}`,
                                completionEvent: `proposal:drc-review:${proposalId}`, // Event for DRC review
                                deadline:
                                    proposal.proposalSemester?.drcReviewDate,
                            })),
                            tx
                        );
                        // Send Emails to DRC Convenors
                        await sendBulkEmails(
                            drcConveners.map((drc) => ({
                                to: drc.email,
                                subject: `PhD Proposal from ${proposal.student.name} requires DRC review`,
                                text: `Dear DRC Convenor,\n\nA PhD proposal submitted by ${proposal.student.name} has been approved by their supervisor and is now ready for your review to finalize the DAC.\n\nPlease log in to the portal to take action:\n${environment.FRONTEND_URL}/phd/drc-convenor/proposal-management/${proposalId}`,
                            }))
                        );
                    } else {
                        console.warn(
                            `Proposal ${proposalId} approved, but no DRC Convenors found with permission 'phd:drc:proposal'.`
                        );
                        // Consider alternative notification if needed
                    }
                    // Scenario 2: Skips DRC, goes directly to DAC Review
                } else if (nextStatus === "dac_review") {
                    // Create To-Dos ONLY for the selected DAC members
                    await createTodos(
                        body.dacMembers.map((dacMember) => ({
                            assignedTo: dacMember.email,
                            createdBy: req.user!.email,
                            title: `PhD Proposal Evaluation Required for ${proposal.student.name}`,
                            description: `Please evaluate the PhD proposal for ${proposal.student.name}.`,
                            module: modules[3],
                            completionEvent: `proposal:dac-review:${proposalId}`, // Event for DAC member review
                            link: `/phd/dac/proposals/${proposalId}`, // Link to DAC member's view
                            deadline: proposal.proposalSemester?.dacReviewDate,
                        })),
                        tx
                    );
                    // Send Emails ONLY to the selected DAC members
                    await sendBulkEmails(
                        body.dacMembers.map((dacMember) => ({
                            to: dacMember.email,
                            subject: `PhD Proposal Evaluation Required for ${proposal.student.name}`,
                            text: `Dear DAC Member,\n\nYou have been assigned to evaluate the PhD proposal for ${proposal.student.name}.\n\nPlease log in to the portal to submit your review:\n${environment.FRONTEND_URL}/phd/dac/proposals/${proposalId}`,
                        }))
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
