import db from "@/config/db/index.ts";
import { checkAccess } from "@/middleware/auth.ts";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import express from "express";
import { desc, eq, gte } from "drizzle-orm";
import { phdProposals, phdProposalSemesters } from "@/config/db/schema/phd.ts";
import { phd } from "@/config/db/schema/admin.ts";

const router = express.Router();

router.get(
    "/",
    checkAccess(),
    asyncHandler(async (req, res) => {
        const student = await db.query.phd.findFirst({
            where: eq(phd.email, req.user!.email),
        });

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
            with: {
                proposalSemester: true,
            },
        });
        const now = new Date();
        const activeDeadline = await db.query.phdProposalSemesters.findFirst({
            where: gte(phdProposalSemesters.studentSubmissionDate, now),
        });
        // const canApply = student?.hasPassedQe && !proposals.some((p) => p.active) && !!activeDeadline;
        const canApply = true;

        res.status(200).json({ proposals, canApply });
    })
);
export default router;
