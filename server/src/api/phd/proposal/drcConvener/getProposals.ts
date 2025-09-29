import db from "@/config/db/index.ts";
import { checkAccess } from "@/middleware/auth.ts";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import express from "express";
import { eq } from "drizzle-orm";
import { phdProposals } from "@/config/db/schema/phd.ts";
import { HttpError, HttpCode } from "@/config/errors.ts";

const router = express.Router();

router.get(
    "/:proposalSemesterId",
    checkAccess(),
    asyncHandler(async (req, res) => {
        const proposalSemesterId = parseInt(req.params.proposalSemesterId);
        if (isNaN(proposalSemesterId)) {
            throw new HttpError(
                HttpCode.BAD_REQUEST,
                "Invalid Proposal Semester ID"
            );
        }
        const proposals = await db.query.phdProposals.findMany({
            where: eq(phdProposals.proposalSemesterId, proposalSemesterId),
            with: {
                student: {
                    columns: {
                        name: true,
                        email: true,
                    },
                },
                proposalSemester: true,
            },
            columns: {
                id: true,
                title: true,
                status: true,
                updatedAt: true,
            },
        });
        res.status(200).json(proposals);
    })
);

export default router;
