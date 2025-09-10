import express from "express";
import db from "@/config/db/index.ts";
import { and, eq } from "drizzle-orm";
import { HttpError, HttpCode } from "@/config/errors.ts";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import { checkAccess } from "@/middleware/auth.ts";
import { phdSchemas } from "lib";
import { phdProposalCoSupervisors } from "@/config/db/schema/phd.ts";

const router = express.Router();

router.post(
    "/:id",
    checkAccess(),
    asyncHandler(async (req, res) => {
        const proposalId = parseInt(req.params.id);
        if (isNaN(proposalId) || proposalId < 0)
            throw new HttpError(HttpCode.BAD_REQUEST, "Invalid proposal ID");
        const parsed = phdSchemas.editCoSupervisorsBodySchema.parse(req.body);
        const proposal = await db.query.phdProposals.findFirst({
            where: (cols, { eq }) => eq(cols.id, proposalId),
        });
        if (!proposal) {
            throw new HttpError(HttpCode.BAD_REQUEST, "Proposal not found");
        }
        if (proposal.status !== "supervisor_review")
            throw new HttpError(
                HttpCode.BAD_REQUEST,
                "Cannot edit co-supervisors now"
            );

        if (parsed.add) {
            const existsInDacMembers =
                await db.query.phdProposalDacMembers.findFirst({
                    where: (cols, { and, eq }) =>
                        and(
                            eq(cols.proposalId, proposalId),
                            eq(cols.dacMemberEmail, parsed.add!)
                        ),
                });
            if (existsInDacMembers)
                throw new HttpError(
                    HttpCode.BAD_REQUEST,
                    "Co-supervisor cannot be a DAC member"
                );
            try {
                await db.insert(phdProposalCoSupervisors).values({
                    proposalId,
                    coSupervisorEmail: parsed.add,
                });
            } catch (e) {
                if ((e as { code: string })?.code === "23503")
                    throw new HttpError(
                        HttpCode.BAD_REQUEST,
                        "Invalid co-supervisor email"
                    );
                throw e;
            }
        } else if (parsed.remove) {
            await db
                .delete(phdProposalCoSupervisors)
                .where(
                    and(
                        eq(
                            phdProposalCoSupervisors.coSupervisorEmail,
                            parsed.remove
                        ),
                        eq(phdProposalCoSupervisors.proposalId, proposalId)
                    )
                );
        }

        res.status(200).json({ success: true });
    })
);

export default router;
