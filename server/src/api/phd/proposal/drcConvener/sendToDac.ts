import db from "@/config/db/index.ts";
import { phdProposals, phdProposalDacMembers } from "@/config/db/schema/phd.ts";
import { checkAccess } from "@/middleware/auth.ts";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import express from "express";
import { eq, inArray, and } from "drizzle-orm";
import { HttpCode, HttpError } from "@/config/errors.ts";
import { completeTodo, createTodos } from "@/lib/todos/index.ts";
import { phdSchemas, modules } from "lib";

const router = express.Router();

router.post(
    "/:id",
    checkAccess(),
    asyncHandler(async (req, res) => {
        const proposalId = parseInt(req.params.id);
        if (isNaN(proposalId) || proposalId < 0)
            throw new HttpError(HttpCode.BAD_REQUEST, "Invalid proposal ID");

        const { acceptedDacMembers } = phdSchemas.sendToDacSchema.parse(
            req.body
        );

        await db.transaction(async (tx) => {
            const proposal = await tx.query.phdProposals.findFirst({
                where: eq(phdProposals.id, proposalId),
                with: { dacMembers: true, student: true },
            });

            if (!proposal)
                throw new HttpError(HttpCode.NOT_FOUND, "Proposal not found");
            if (proposal.status !== "drc_review")
                throw new HttpError(
                    HttpCode.BAD_REQUEST,
                    "Proposal not ready to be sent to DAC"
                );

            const currentDacEmails = proposal.dacMembers.map(
                (m) => m.dacMemberEmail
            );
            const acceptedEmails = acceptedDacMembers.filter((email) =>
                currentDacEmails.includes(email)
            );

            if (acceptedEmails.length < 2) {
                throw new HttpError(
                    HttpCode.BAD_REQUEST,
                    "At least 2 DAC members must be accepted"
                );
            }

            const emailsToDelete = currentDacEmails.filter(
                (email) => !acceptedEmails.includes(email)
            );

            if (emailsToDelete.length > 0) {
                await tx
                    .delete(phdProposalDacMembers)
                    .where(
                        and(
                            eq(phdProposalDacMembers.proposalId, proposalId),
                            inArray(
                                phdProposalDacMembers.dacMemberEmail,
                                emailsToDelete
                            )
                        )
                    );
            }

            await tx
                .update(phdProposals)
                .set({ status: "dac_review" })
                .where(eq(phdProposals.id, proposalId));

            await completeTodo(
                {
                    module: modules[3],
                    completionEvent: `proposal:drc-review:${proposalId}`,
                },
                tx
            );

            if (acceptedEmails.length > 0) {
                await createTodos(
                    acceptedEmails.map((email) => ({
                        module: modules[3],
                        assignedTo: email,
                        createdBy: req.user!.email,
                        title: "PhD Proposal Evaluation Required",
                        description: `Please evaluate the PhD proposal for ${proposal.student.name}.`,
                        link: `/phd/dac/proposals`,
                        completionEvent: `proposal:dac-review:${proposalId}`,
                    })),
                    tx
                );
            }
        });

        res.status(200).json({
            success: true,
            message: "Proposal sent to DAC members.",
        });
    })
);

export default router;
