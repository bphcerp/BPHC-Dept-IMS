import db from "@/config/db/index.ts";
import { checkAccess } from "@/middleware/auth.ts";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import express from "express";
import { desc } from "drizzle-orm";
import { phdProposals } from "@/config/db/schema/phd.ts";

const router = express.Router();

router.get(
    "/",
    checkAccess(),
    asyncHandler(async (req, res) => {
        const proposals = await db.query.phdProposals.findMany({
            columns: {
                id: true,
                title: true,
                status: true,
                updatedAt: true,
                active: true,
            },
            where: (cols, { and, eq }) =>
                and(eq(cols.studentEmail, req.user!.email)),
            with: {
                dacReviews: {
                    columns: {
                        comments: true,
                        approved: true,
                    },
                },
            },
            orderBy: desc(phdProposals.updatedAt),
        });

        const formattedProposals = proposals.map((p) => {
            const rejectionComments =
                p.status === "dac_rejected"
                    ? p.dacReviews
                          .filter((r) => !r.approved)
                          .map((r) => r.comments)
                          .join("\n---\n") // TODO: improve comment feedback formatting
                    : null;

            return {
                id: p.id,
                title: p.title,
                status: p.status,
                updatedAt: p.updatedAt,
                active: p.active,
                comments: rejectionComments,
            };
        });

        const canApply = !proposals.some((p) => p.active);

        res.status(200).json({ proposals: formattedProposals, canApply });
    })
);

export default router;
