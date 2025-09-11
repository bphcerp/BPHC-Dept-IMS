import db from "@/config/db/index.ts";
import { checkAccess } from "@/middleware/auth.ts";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import express from "express";
import {  eq } from "drizzle-orm";
import { phdProposalDacMembers } from "@/config/db/schema/phd.ts";
import { HttpError, HttpCode } from "@/config/errors.ts";

const router = express.Router();

router.get(
    "/:proposalSemesterId",
    checkAccess(),
    asyncHandler(async (req, res) => {
        const dacMemberEmail = req.user!.email;
        const proposalSemesterId = parseInt(req.params.proposalSemesterId);

        if (isNaN(proposalSemesterId)) {
            throw new HttpError(
                HttpCode.BAD_REQUEST,
                "Invalid Proposal Semester ID"
            );
        }

        const assignedProposalLinks =
            await db.query.phdProposalDacMembers.findMany({
                where: eq(phdProposalDacMembers.dacMemberEmail, dacMemberEmail),
                with: {
                    proposal: {
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

        const assignedProposals = assignedProposalLinks
            .filter(
                (link) =>
                    link.proposal.status === "dac_review" &&
                    link.proposal.proposalSemesterId === proposalSemesterId
            )
            .map((link) => ({
                id: link.proposal.id,
                title: link.proposal.title,
                status: link.proposal.status,
                updatedAt: link.proposal.updatedAt,
                student: {
                    name: link.proposal.student.name,
                    email: link.proposal.student.email,
                },
            }));

        res.status(200).json(assignedProposals);
    })
);

export default router;
