import db from "@/config/db/index.ts";
import { checkAccess } from "@/middleware/auth.ts";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import express from "express";

const router = express.Router();

router.get(
    "/",
    checkAccess(),
    asyncHandler(async (_req, res) => {
        const proposalSemesters = await db.query.phdProposalSemesters.findMany({
            with: {
                semester: {
                    columns: {
                        year: true,
                        semesterNumber: true,
                    },
                },
            },
            orderBy: (cols, { desc }) => [desc(cols.id)],
        });

        res.status(200).json(proposalSemesters);
    })
);

export default router;
