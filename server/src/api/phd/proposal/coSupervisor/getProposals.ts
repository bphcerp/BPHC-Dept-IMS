import db from "@/config/db/index.ts";
import { checkAccess } from "@/middleware/auth.ts";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import express from "express";

const router = express.Router();

router.get(
    "/",
    checkAccess(),
    asyncHandler(async (req, res) => {
        const coSupervising = await db.query.phdProposalCoSupervisors.findMany({
            where: (cols, { eq }) =>
                eq(cols.coSupervisorEmail, req.user!.email),
            with: {
                proposal: {
                    columns: {
                        id: true,
                        title: true,
                        status: true,
                        updatedAt: true,
                    },
                    with: {
                        student: {
                            columns: {
                                name: true,
                                email: true,
                            },
                        },
                    },
                },
            },
        });

        const proposals = coSupervising.reduce(
            (acc, curr) => {
                if (curr.proposal.status === "cosupervisor_review")
                    acc.push(curr.proposal);
                return acc;
            },
            [] as (typeof coSupervising)[0]["proposal"][]
        );

        res.status(200).json(proposals);
    })
);

export default router;
