// server/src/api/phd-request/hod/getRequests.ts
import { asyncHandler } from "@/middleware/routeHandler.ts";
import { checkAccess } from "@/middleware/auth.ts";
import express from "express";
import db from "@/config/db/index.ts";
import { phdRequests } from "@/config/db/schema/phdRequest.ts";
import { eq, desc } from "drizzle-orm";

const router = express.Router();

router.get(
    "/",
    checkAccess(),
    asyncHandler(async (_req, res) => {
        const requests = await db.query.phdRequests.findMany({
            where: eq(phdRequests.status, "hod_review"),
            with: {
                student: { columns: { name: true, email: true } },
                supervisor: { columns: { name: true, email: true } },
            },
            orderBy: [desc(phdRequests.updatedAt)],
        });

        res.status(200).json(requests);
    })
);

export default router;
