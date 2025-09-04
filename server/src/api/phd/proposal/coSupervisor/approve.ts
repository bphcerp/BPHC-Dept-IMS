import db from "@/config/db/index.ts";
import { phdProposalCoSupervisors } from "@/config/db/schema/phd.ts";
import { HttpCode, HttpError } from "@/config/errors.ts";
import { checkAccess } from "@/middleware/auth.ts";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import { eq } from "drizzle-orm";
import express from "express";

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
            },
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
            (coSupervisor) => coSupervisor.coSupervisorEmail === req.user!.email
        );

        if (!coSupervisorRecord) {
            throw new HttpError(
                HttpCode.BAD_REQUEST,
                "You are not a co-supervisor for this proposal"
            );
        }

        await db
            .update(phdProposalCoSupervisors)
            .set({
                approvalStatus: true,
            })
            .where(eq(phdProposalCoSupervisors.id, coSupervisorRecord.id));

        res.status(200).json({ success: true });
    })
);

export default router;
