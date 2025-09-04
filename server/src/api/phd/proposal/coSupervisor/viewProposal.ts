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
                coSupervisors: {
                    columns: {
                        coSupervisorEmail: true,
                        approvalStatus: true,
                    },
                    with: {
                        coSupervisor: {
                            columns: {
                                name: true,
                                email: true,
                            },
                        },
                    },
                },
            },
        });

        if (!proposal)
            throw new HttpError(HttpCode.NOT_FOUND, "Proposal not found");

        const currentUserCoSupervisor = proposal.coSupervisors.find(
            (coSupervisor) => coSupervisor.coSupervisorEmail === req.user!.email
        );

        if (!currentUserCoSupervisor) {
            throw new HttpError(
                HttpCode.BAD_REQUEST,
                "You are not a co-supervisor for this proposal"
            );
        }

        const { abstractFileId, proposalFileId, ...rest } = proposal;
        const { coSupervisors, ...data } = rest;

        const response = {
            abstractFileUrl: environment.SERVER_URL + "/f/" + abstractFileId,
            proposalFileUrl: environment.SERVER_URL + "/f/" + proposalFileId,
            ...data,
            coSupervisors: coSupervisors.map((cs) => ({
                name: cs.coSupervisor.name,
                email: cs.coSupervisor.email,
            })),
            currentUserApproval: currentUserCoSupervisor.approvalStatus,
        };

        res.status(200).json(response);
    })
);

export default router;
