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
                appendixFile: true,
                summaryFile: true,
                outlineFile: true,
                placeOfResearchFile: true,
                outsideCoSupervisorFormatFile: true,
                outsideSupervisorBiodataFile: true,
                proposalSemester: true,
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
        const currentUserReview =
            await db.query.phdProposalDacReviews.findFirst({
                where: and(
                    eq(phdProposalDacReviews.proposalId, proposalId),
                    eq(phdProposalDacReviews.dacMemberEmail, req.user!.email)
                ),
            });
        const response = {
            ...proposal,
            appendixFileUrl: `${environment.SERVER_URL}/f/${proposal.appendixFileId}`,
            summaryFileUrl: `${environment.SERVER_URL}/f/${proposal.summaryFileId}`,
            outlineFileUrl: `${environment.SERVER_URL}/f/${proposal.outlineFileId}`,
            placeOfResearchFileUrl: proposal.placeOfResearchFileId
                ? `${environment.SERVER_URL}/f/${proposal.placeOfResearchFileId}`
                : null,
            outsideCoSupervisorFormatFileUrl:
                proposal.outsideCoSupervisorFormatFileId
                    ? `${environment.SERVER_URL}/f/${proposal.outsideCoSupervisorFormatFileId}`
                    : null,
            outsideSupervisorBiodataFileUrl:
                proposal.outsideSupervisorBiodataFileId
                    ? `${environment.SERVER_URL}/f/${proposal.outsideSupervisorBiodataFileId}`
                    : null,
            currentUserReview,
        };
        res.status(200).json(response);
    })
);
export default router;
