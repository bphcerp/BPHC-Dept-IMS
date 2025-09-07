import db from "@/config/db/index.ts";
import { phdProposals } from "@/config/db/schema/phd.ts";
import { checkAccess } from "@/middleware/auth.ts";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import express from "express";
import { eq } from "drizzle-orm";
import { HttpCode, HttpError } from "@/config/errors.ts";
import { completeTodo, createTodos } from "@/lib/todos/index.ts";
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
            where: eq(phdProposals.id, proposalId),
            with: { dacMembers: true, student: true },
        });

        if (!proposal) throw new HttpError(HttpCode.NOT_FOUND, "Proposal not found");
        if (proposal.status !== "drc_review") throw new HttpError(HttpCode.BAD_REQUEST, "Proposal not ready to be sent to DAC");

        await tx
            .update(phdProposals)
            .set({ status: "dac_review" })
            .where(eq(phdProposals.id, proposalId));

        const drcConveners = await getUsersWithPermission("phd:drc:proposal", tx);
        const completionEvents = drcConveners.map(drc => `proposal:drc-review:${proposalId}:${drc.email}`);

        await completeTodo({
            module: modules[3],
            completionEvent: completionEvents
        }, tx);
        
        if (proposal.dacMembers.length > 0) {
            await createTodos(proposal.dacMembers.map(member => ({
                module: modules[3],
                assignedTo: member.dacMemberEmail,
                createdBy: req.user!.email,
                title: "PhD Proposal Evaluation Required",
                description: `Please evaluate the PhD proposal for ${proposal.student.name}.`,
                link: `/phd/dac/proposal/${proposalId}`, // NOTE: This route needs to be created
                completionEvent: `proposal:dac-review:${proposalId}:${member.dacMemberEmail}`
            })), tx);
        }
    });

    res.status(200).json({ success: true, message: "Proposal sent to DAC members." });
  }),
);

export default router;