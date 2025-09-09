import db from "@/config/db/index.ts";
import { checkAccess } from "@/middleware/auth.ts";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import express from "express";

const router = express.Router();

router.get(
    "/",
    checkAccess(),
    asyncHandler(async (_req, res) => {
        const proposals = await db.query.phdProposals.findMany({
            where: (cols, { eq }) => eq(cols.status, "drc_review"),
            with: {
                student: {
                    columns: {
                        name: true,
                        email: true,
                    },
                },
            },
            columns: {
                id: true,
                title: true,
                status: true,
                updatedAt: true,
            },
        });

        res.status(200).json(proposals);
    })
);

export default router;
