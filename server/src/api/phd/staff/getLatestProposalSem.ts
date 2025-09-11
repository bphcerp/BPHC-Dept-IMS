import express from "express";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import { checkAccess } from "@/middleware/auth.ts";
import db from "@/config/db/index.ts";

const router = express.Router();

router.get(
    "/",
    checkAccess(),
    asyncHandler(async (_req, res) => {
        const proposalSemester = await db.query.phdProposalSemesters.findFirst({
            orderBy: (table, { desc }) => [desc(table.id)],
            with: {
                semester: true,
            },
        });
        res.status(200).json({ proposalSemester });
    })
);

export default router;
