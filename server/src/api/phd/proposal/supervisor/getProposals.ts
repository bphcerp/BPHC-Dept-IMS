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
            },
            with: {
                student: {
                    columns: {
                        name: true,
                        email: true,
                    },
                },
            },
            where: (cols, { and, eq }) =>
                and(
                    eq(cols.supervisorEmail, req.user!.email),
                    eq(cols.status, "supervisor_review")
                ),
        });

        res.status(200).json(proposals);
    })
);

export default router;
