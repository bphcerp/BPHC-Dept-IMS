import db from "@/config/db/index.ts";
import { checkAccess } from "@/middleware/auth.ts";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import express from "express";

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
        });
        const canApply = true; // TODO: Implement actual eligibility check logic
        res.status(200).json({ proposals, canApply });
    })
);

export default router;
