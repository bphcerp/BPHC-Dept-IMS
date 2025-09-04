import db from "@/config/db/index.ts";
import { phdProposals } from "@/config/db/schema/phd.ts";
import { HttpCode, HttpError } from "@/config/errors.ts";
import { completeTodo } from "@/lib/todos/index.ts";
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
        if (proposal.coSupervisors.length < 1)
            throw new HttpError(
                HttpCode.BAD_REQUEST,
                "No co-supervisors assigned"
            );
        if (proposal.dacMembers.length < 1)
            throw new HttpError(
                HttpCode.BAD_REQUEST,
                "No DAC members assigned"
            );
        await db.transaction(async (tx) => {
            await tx
                .update(phdProposals)
                .set({
                    status: "cosupervisor_review",
                })
                .where(eq(phdProposals.id, proposalId));
            await completeTodo(
                {
                    module: modules[3],
                    completionEvent: `proposal:supervisor-review:${proposal.id}`,
                },
                tx
            );
        });
        res.status(200).json({});
    })
);

export default router;
