import express from "express";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import { checkAccess } from "@/middleware/auth.ts";
import db from "@/config/db/index.ts";
import { phdProposalSemesters } from "@/config/db/schema/phd.ts";
import { gte } from "drizzle-orm";

const router = express.Router();

export default router.get(
    "/",
    checkAccess(),
    asyncHandler(async (_req, res) => {
        const now = new Date();

        const deadlines = await db.query.phdProposalSemesters.findMany({
            where: gte(phdProposalSemesters.studentSubmissionDate, now),
            with: { semester: true },
            orderBy: (table, { asc }) => [asc(table.studentSubmissionDate)],
        });

        res.status(200).json({ deadlines });
    })
);
