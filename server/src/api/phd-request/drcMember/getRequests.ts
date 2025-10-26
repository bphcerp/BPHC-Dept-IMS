import { asyncHandler } from "@/middleware/routeHandler.ts";
import { checkAccess } from "@/middleware/auth.ts";
import express from "express";
import db from "@/config/db/index.ts";
import {
    phdRequests,
    phdRequestDrcAssignments,
} from "@/config/db/schema/phdRequest.ts";
import { eq, and, inArray } from "drizzle-orm";

const router = express.Router();

router.get(
    "/",
    checkAccess(),
    asyncHandler(async (req, res) => {
        const drcMemberEmail = req.user!.email;

        const assignments = await db.query.phdRequestDrcAssignments.findMany({
            where: and(
                eq(phdRequestDrcAssignments.drcMemberEmail, drcMemberEmail),
                eq(phdRequestDrcAssignments.status, "pending")
            ),
            columns: {
                requestId: true,
            },
        });

        if (assignments.length === 0) {
            res.status(200).json([]);
        }

        const requestIds = assignments.map((a) => a.requestId);
        const requests = await db.query.phdRequests.findMany({
            where: inArray(phdRequests.id, requestIds),
            with: {
                student: { columns: { name: true, email: true } },
                supervisor: { columns: { name: true, email: true } },
            },
        });

        res.status(200).json(requests);
    })
);

export default router;
