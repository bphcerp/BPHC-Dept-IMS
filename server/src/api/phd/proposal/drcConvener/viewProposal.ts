import db from "@/config/db/index.ts";
import environment from "@/config/environment.ts";
import { HttpCode, HttpError } from "@/config/errors.ts";
import { checkAccess } from "@/middleware/auth.ts";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import express from "express";
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
                dacReviews: {
                    with: {
                        dacMember: true,
                        reviewForm: true,
                        feedbackFile: true,
                    },
                },
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
        };
        res.status(200).json(response);
    })
);
export default router;
