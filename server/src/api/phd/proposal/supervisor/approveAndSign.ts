import db from "@/config/db/index.ts";
import { phdProposals, phdProposalDacMembers } from "@/config/db/schema/phd.ts";
import { HttpCode, HttpError } from "@/config/errors.ts";
import { completeTodo, createTodos } from "@/lib/todos/index.ts";
import { checkAccess } from "@/middleware/auth.ts";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import { eq, and, notInArray } from "drizzle-orm";
import express from "express";
import { modules, phdSchemas } from "lib";
import { getUsersWithPermission } from "@/lib/common/index.ts";

const router = express.Router();

router.post(
    "/:id",
    checkAccess(),
    asyncHandler(async (req, res) => {
        const proposalId = parseInt(req.params.id);
        if (isNaN(proposalId) || proposalId < 0)
            throw new HttpError(HttpCode.BAD_REQUEST, "Invalid proposal ID");

        const { dacMembers, comments } =
            phdSchemas.supervisorProposalAcceptSchema.parse(req.body);

        const proposal = await db.query.phdProposals.findFirst({
            where: (cols, { eq }) => eq(cols.id, proposalId),
            with: { student: true, dacMembers: true },
        });

        if (!proposal) {
            throw new HttpError(HttpCode.BAD_REQUEST, "Proposal not found");
        }
        if (proposal.status !== "supervisor_review") {
            throw new HttpError(
                HttpCode.BAD_REQUEST,
                "Proposal not in supervisor review stage"
            );
        }

        await db.transaction(async (tx) => {
            // Update DAC members
            const currentDacEmails = proposal.dacMembers.map(
                (m) => m.dacMemberEmail
            );
            const dacMembersToAdd = dacMembers.filter(
                (email) => !currentDacEmails.includes(email)
            );
            const dacMembersToRemove = currentDacEmails.filter(
                (email) => !dacMembers.includes(email)
            );

            if (dacMembersToAdd.length > 0) {
                await tx.insert(phdProposalDacMembers).values(
                    dacMembersToAdd.map((email) => ({
                        proposalId,
                        dacMemberEmail: email,
                    }))
                );
            }
            if (dacMembersToRemove.length > 0) {
                await tx
                    .delete(phdProposalDacMembers)
                    .where(
                        and(
                            eq(phdProposalDacMembers.proposalId, proposalId),
                            notInArray(
                                phdProposalDacMembers.dacMemberEmail,
                                dacMembers
                            )
                        )
                    );
            }

            // Update proposal status
            await tx
                .update(phdProposals)
                .set({ status: "drc_review", comments: comments || null })
                .where(eq(phdProposals.id, proposalId));

            await completeTodo(
                {
                    module: modules[3],
                    completionEvent: `proposal:supervisor-review:${proposal.id}`,
                },
                tx
            );

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
                    })),
                    tx
                );
            }
        });

        res.status(200).send({ success: true });
    })
);

export default router;
