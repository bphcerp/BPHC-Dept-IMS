import express from "express";
import db from "@/config/db/index.ts";
import { and, eq } from "drizzle-orm";
import { HttpError, HttpCode } from "@/config/errors.ts";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import { checkAccess } from "@/middleware/auth.ts";
import { phdSchemas } from "lib";
import { phdProposalDacMembers } from "@/config/db/schema/phd.ts";

const router = express.Router();

router.post(
    "/:id",
    checkAccess(),
    asyncHandler(async (req, res) => {
        const proposalId = parseInt(req.params.id);
        if (isNaN(proposalId) || proposalId < 0)
            throw new HttpError(HttpCode.BAD_REQUEST, "Invalid proposal ID");
        const parsed = phdSchemas.editDacMembersBodySchema.parse(req.body);
        const proposal = await db.query.phdProposals.findFirst({
            where: (cols, { eq }) => eq(cols.id, proposalId),
        });
        if (!proposal) {
            throw new HttpError(HttpCode.BAD_REQUEST, "Proposal not found");
        }
        if (proposal.status !== "supervisor_review")
            throw new HttpError(
                HttpCode.BAD_REQUEST,
                "Cannot edit DAC members now"
            );

        if (parsed.add) {
            const existsInCoSupervisors =
                await db.query.phdProposalCoSupervisors.findFirst({
                    where: (cols, { and, eq }) =>
                        and(
                            eq(cols.proposalId, proposalId),
                            eq(cols.coSupervisorEmail, parsed.add!)
                        ),
                });
            if (existsInCoSupervisors)
                throw new HttpError(
                    HttpCode.BAD_REQUEST,
                    "DAC member cannot be a co-supervisor"
                );
            try {
                await db.insert(phdProposalDacMembers).values({
                    proposalId,
                    dacMemberEmail: parsed.add,
                });
            } catch (e) {
                if ((e as { code: string })?.code === "23503")
                    throw new HttpError(
                        HttpCode.BAD_REQUEST,
                        "Invalid DAC member email"
                    );
                throw e;
            }
        } else if (parsed.remove) {
            await db
                .delete(phdProposalDacMembers)
                .where(
                    and(
                        eq(phdProposalDacMembers.dacMemberEmail, parsed.remove),
                        eq(phdProposalDacMembers.proposalId, proposalId)
                    )
                );
        }

        res.status(200).json({ success: true });
    })
);

export default router;
