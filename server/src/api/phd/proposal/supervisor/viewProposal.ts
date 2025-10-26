import db from "@/config/db/index.ts";
import environment from "@/config/environment.ts";
import { HttpCode, HttpError } from "@/config/errors.ts";
import { checkAccess } from "@/middleware/auth.ts";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import express from "express";
import { eq, and } from "drizzle-orm";
import { phdProposals } from "@/config/db/schema/phd.ts";
import { todoExists } from "@/lib/todos/index.ts";
import { modules } from "lib";

const router = express.Router();
router.get(
    "/:id",
    checkAccess(),
    asyncHandler(async (req, res) => {
        const proposalId = parseInt(req.params.id);
        if (isNaN(proposalId))
            throw new HttpError(HttpCode.BAD_REQUEST, "Invalid proposal ID");

        const proposal = await db.query.phdProposals.findFirst({
            where: and(
                eq(phdProposals.id, proposalId),
                eq(phdProposals.supervisorEmail, req.user!.email)
            ),
            with: {
                student: true,
                dacMembers: { with: { dacMember: true } },
                dacReviews: { with: { dacMember: true } },
                coSupervisors: { with: { coSupervisor: true } },
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

        let canBookSlot = false;
        if (
            proposal.status === "dac_accepted" ||
            proposal.status === "seminar_pending"
        ) {
            const [todoResult] = await todoExists([
                {
                    module: modules[3],
                    completionEvent: `proposal:set-seminar-details:${proposal.id}`,
                    assignedTo: req.user!.email,
                },
            ]);
            canBookSlot = todoResult;
        }

        const isResubmission =
            proposal.status === "supervisor_review" &&
            proposal.updatedAt.getTime() !== proposal.createdAt.getTime();

        const response = {
            ...proposal,
            isResubmission,
            canBookSlot, // Add the result of the check to the response
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
