import db from "@/config/db/index.ts";
import environment from "@/config/environment.ts";
import { HttpCode, HttpError } from "@/config/errors.ts";
import { checkAccess } from "@/middleware/auth.ts";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import express from "express";
import { and, eq } from "drizzle-orm";
import { phdProposalDacReviews } from "@/config/db/schema/phd.ts";

const router = express.Router();

router.get(
  "/:id",
  checkAccess(),
  asyncHandler(async (req, res) => {
    const proposalId = parseInt(req.params.id);
    if (isNaN(proposalId))
      throw new HttpError(HttpCode.BAD_REQUEST, "Invalid proposal ID");

    const proposal = await db.query.phdProposals.findFirst({
      where: (cols, { eq }) => eq(cols.id, proposalId),
      with: {
        student: true,
        supervisor: true,
        coSupervisors: { with: { coSupervisor: true } },
        dacMembers: { with: { dacMember: true } },
      },
    });

    if (!proposal)
      throw new HttpError(HttpCode.NOT_FOUND, "Proposal not found");

    const isDacMember = proposal.dacMembers.some(
      (m) => m.dacMemberEmail === req.user!.email
    );
    if (!isDacMember) {
      throw new HttpError(
        HttpCode.FORBIDDEN,
        "You are not a DAC member for this proposal"
      );
    }

    const currentUserReview = await db.query.phdProposalDacReviews.findFirst({
      where: and(
        eq(phdProposalDacReviews.proposalId, proposalId),
        eq(phdProposalDacReviews.dacMemberEmail, req.user!.email)
      ),
    });

    const { abstractFileId, proposalFileId, ...rest } = proposal;
    const response = {
      ...rest,
      abstractFileUrl: `${environment.SERVER_URL}/f/${abstractFileId}`,
      proposalFileUrl: `${environment.SERVER_URL}/f/${proposalFileId}`,
      currentUserReview,
    };

    res.status(200).json(response);
  })
);

export default router;