import db from "@/config/db/index.ts";
import {
    phdProposals,
    phdProposalCoSupervisors,
} from "@/config/db/schema/phd.ts";
import { HttpCode, HttpError } from "@/config/errors.ts";
import { checkAccess } from "@/middleware/auth.ts";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import { and, eq, not } from "drizzle-orm";
import express from "express";
import { createTodos } from "@/lib/todos/index.ts";
import { modules } from "lib";
import { getUsersWithPermission } from "@/lib/common/index.ts";

const router = express.Router();

router.post(
    "/:id",
    checkAccess(),
    asyncHandler(async (req, res) => {
        const proposalId = parseInt(req.params.id);
        if (isNaN(proposalId) || proposalId < 0)
            throw new HttpError(HttpCode.BAD_REQUEST, "Invalid proposal ID");

        await db.transaction(async (tx) => {
            const proposal = await tx.query.phdProposals.findFirst({
                where: (cols, { eq }) => eq(cols.id, proposalId),
                with: { coSupervisors: true, student: true },
            });

            if (!proposal) {
                throw new HttpError(HttpCode.BAD_REQUEST, "Proposal not found");
            }
            if (proposal.status !== "cosupervisor_review")
                throw new HttpError(
                    HttpCode.BAD_REQUEST,
                    "Proposal not in co-supervisor review stage"
                );

            const coSupervisorRecord = proposal.coSupervisors.find(
                (coSupervisor) =>
                    coSupervisor.coSupervisorEmail === req.user!.email
            );

            if (!coSupervisorRecord) {
                throw new HttpError(
                    HttpCode.BAD_REQUEST,
                    "You are not a co-supervisor for this proposal"
                );
            }

            await tx
                .update(phdProposalCoSupervisors)
                .set({ approvalStatus: true })
                .where(eq(phdProposalCoSupervisors.id, coSupervisorRecord.id));

            // Check if all co-supervisors have approved
            const remainingApprovals =
                await tx.query.phdProposalCoSupervisors.findMany({
                    where: and(
                        eq(phdProposalCoSupervisors.proposalId, proposalId),
                        not(
                            eq(
                                phdProposalCoSupervisors.id,
                                coSupervisorRecord.id
                            )
                        )
                    ),
                });

            const allApproved = remainingApprovals.every(
                (cs) => cs.approvalStatus === true
            );

            if (allApproved) {
                await tx
                    .update(phdProposals)
                    .set({ status: "drc_review" })
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
                            title: "PhD Proposal Ready for Review",
                            description: `Proposal by ${proposal.student.name} is approved by all co-supervisors and is awaiting your review.`,
                            link: `/phd/drc-convenor/proposal-management/view/${proposalId}`,
                            completionEvent: `proposal:drc-review:${proposalId}:${drc.email}`,
                        })),
                        tx
                    );
                }
            }
        });

        res.status(200).json({ success: true });
    })
);

export default router;
