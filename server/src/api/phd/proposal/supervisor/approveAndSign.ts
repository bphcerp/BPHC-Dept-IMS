import db from "@/config/db/index.ts";
import { phdProposals } from "@/config/db/schema/phd.ts";
import { HttpCode, HttpError } from "@/config/errors.ts";
import { completeTodo, createTodos } from "@/lib/todos/index.ts";
import { checkAccess } from "@/middleware/auth.ts";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import { eq } from "drizzle-orm";
import express from "express";
import { modules } from "lib";

const router = express.Router();

router.post(
    "/:id",
    checkAccess(),
    asyncHandler(async (req, res) => {
        const proposalId = parseInt(req.params.id);
        if (isNaN(proposalId) || proposalId < 0)
            throw new HttpError(HttpCode.BAD_REQUEST, "Invalid proposal ID");
        const proposal = await db.query.phdProposals.findFirst({
            where: (cols, { eq }) => eq(cols.id, proposalId),
            with: {
                coSupervisors: true,
                dacMembers: true,
            },
        });
        if (!proposal) {
            throw new HttpError(HttpCode.BAD_REQUEST, "Proposal not found");
        }
        if (proposal.status !== "supervisor_review")
            throw new HttpError(
                HttpCode.BAD_REQUEST,
                "proposal not in supervisor review stage"
            );
        if (proposal.dacMembers.length < 2)
            throw new HttpError(
                HttpCode.BAD_REQUEST,
                "At least 2 DAC members required"
            );
        await db.transaction(async (tx) => {
            await tx
                .update(phdProposals)
                .set({
                    status:
                        proposal.coSupervisors.length < 1
                            ? "drc_review"
                            : "cosupervisor_review",
                })
                .where(eq(phdProposals.id, proposalId));
            await completeTodo(
                {
                    module: modules[3],
                    completionEvent: `proposal:supervisor-review:${proposal.id}`,
                },
                tx
            );
            if (proposal.coSupervisors.length)
                await createTodos(
                    proposal.coSupervisors.map((cs) => ({
                        title: "PhD Proposal Co Supervisor Review",
                        description: "Please verify the PhD proposal details",
                        module: modules[3],
                        completionEvent: `phd:proposal:supervisor-review:${proposal.id}`,
                        assignedTo: cs.coSupervisorEmail,
                        createdBy: req.user!.email,
                        link: `/phd/coSupervisor/proposals/${proposal.id}`,
                    })),
                    tx
                );
        });
        res.status(200).send();
    })
);

export default router;
