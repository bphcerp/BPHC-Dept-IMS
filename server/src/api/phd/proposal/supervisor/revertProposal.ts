import db from "@/config/db/index.ts";
import { phdProposals } from "@/config/db/schema/phd.ts";
import { HttpCode, HttpError } from "@/config/errors.ts";
import { checkAccess } from "@/middleware/auth.ts";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import { eq } from "drizzle-orm";
import express from "express";
import { phdSchemas } from "lib";

const router = express.Router();

router.post("/:id", checkAccess(), asyncHandler(async (req, res) => {
    const proposalId = parseInt(req.params.id);
    if (isNaN(proposalId)) throw new HttpError(HttpCode.BAD_REQUEST, "Invalid proposal ID");

    const { comments } = phdSchemas.proposalRevertSchema.parse(req.body);

    const proposal = await db.query.phdProposals.findFirst({
        where: (cols, {eq}) => eq(cols.id, proposalId),
    });

    if (!proposal) throw new HttpError(HttpCode.NOT_FOUND, "Proposal not found");
    if (proposal.supervisorEmail !== req.user!.email) throw new HttpError(HttpCode.FORBIDDEN, "Forbidden");
    if (proposal.status !== "supervisor_review") throw new HttpError(HttpCode.BAD_REQUEST, "Proposal not in correct state to revert");

    await db.update(phdProposals)
        .set({ status: "supervisor_revert", comments })
        .where(eq(phdProposals.id, proposalId));
    
    // TODO: Add a notification/todo for the student

    res.status(200).json({ success: true, message: "Proposal reverted to student."});
}));

export default router;