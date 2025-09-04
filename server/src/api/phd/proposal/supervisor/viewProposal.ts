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
                    with: {
                        coSupervisor: {
                            columns: {
                                name: true,
                            },
                        },
                    },
                },
                dacMembers: {
                    with: {
                        dacMember: {
                            columns: {
                                name: true,
                                department: true,
                            },
                        },
                    },
                },
            },
        });
        if (!proposal)
            throw new HttpError(HttpCode.NOT_FOUND, "Proposal not found");
        const { abstractFileId, proposalFileId, ...rest } = proposal;

        res.status(200).json({
            abstractFileUrl: environment.SERVER_URL + "/f/" + abstractFileId,
            proposalFileUrl: environment.SERVER_URL + "/f/" + proposalFileId,
            ...rest,
        });
    })
);

export default router;
