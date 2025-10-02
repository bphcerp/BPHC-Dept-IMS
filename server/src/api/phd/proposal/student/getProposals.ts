import db from "@/config/db/index.ts";
import { checkAccess } from "@/middleware/auth.ts";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import express from "express";
import { desc, eq, 
    // gte
 } from "drizzle-orm";
import {
    phdProposals,
    // phdProposalSemesters,
    phdProposalDacReviews,
} from "@/config/db/schema/phd.ts";
// import { phd } from "@/config/db/schema/admin.ts";
import environment from "@/config/environment.ts";
const router = express.Router();
router.get(
    "/",
    checkAccess(),
    asyncHandler(async (req, res) => {
        // const student = await db.query.phd.findFirst({
        //     where: eq(phd.email, req.user!.email),
        // });
        const proposals = await db.query.phdProposals.findMany({
            columns: {
                id: true,
                title: true,
                status: true,
                updatedAt: true,
                active: true,
                comments: true,
                seminarDate: true,
                seminarTime: true,
                seminarVenue: true,
            },
            where: (cols, { and, eq }) =>
                and(eq(cols.studentEmail, req.user!.email)),
            orderBy: desc(phdProposals.updatedAt),
            with: { proposalSemester: true },
        });
        const proposalsWithDacFeedback = await Promise.all(
            proposals.map(async (p) => {
                if (p.status === "dac_revert") {
                    const dacReviews =
                        await db.query.phdProposalDacReviews.findMany({
                            where: eq(phdProposalDacReviews.proposalId, p.id),
                            with: { feedbackFile: true },
                        });
                    const dacFeedback = dacReviews
                        .filter((review) => !review.approved)
                        .map((review) => ({
                            comments: review.comments,
                            feedbackFileUrl: review.feedbackFileId
                                ? `${environment.SERVER_URL}/f/${review.feedbackFileId}`
                                : null,
                        }));
                    const dacSummary = dacReviews.map((review, index) => ({
                        label: `DAC ${index + 1}`,
                        status: review.approved ? "Approved" : "Reverted",
                    }));
                    return { ...p, dacFeedback, dacSummary };
                }
                return p;
            })
        );
        // const now = new Date();
        // const activeDeadline = await db.query.phdProposalSemesters.findFirst({
        //     where: gte(phdProposalSemesters.studentSubmissionDate, now),
        // });
        // const canApply = student?.hasPassedQe && !proposals.some((p) => p.active) && !!activeDeadline;
        const canApply = true;
        res.status(200).json({ proposals: proposalsWithDacFeedback, canApply });
    })
);
export default router;
