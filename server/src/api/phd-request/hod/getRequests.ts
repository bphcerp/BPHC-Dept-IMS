import { asyncHandler } from "@/middleware/routeHandler.ts";
import { checkAccess } from "@/middleware/auth.ts";
import express from "express";
import db from "@/config/db/index.ts";
import {
    phdRequests,
    phdRequestReviews,
} from "@/config/db/schema/phdRequest.ts";
import { eq, desc, inArray } from "drizzle-orm";

const router = express.Router();

router.get(
    "/",
    checkAccess(),
    asyncHandler(async (req, res) => {
        const filter = req.query.filter === "all" ? "all" : "pending";

        let requests;

        if (filter === "pending") {
            requests = await db.query.phdRequests.findMany({
                where: eq(phdRequests.status, "hod_review"),
                with: {
                    student: {
                        columns: { name: true, email: true },
                    },
                    supervisor: {
                        columns: { name: true, email: true },
                    },
                },
                orderBy: [desc(phdRequests.updatedAt)],
            });
        } else {
            const reviewedRequestIds = await db
                .selectDistinct({ id: phdRequestReviews.requestId })
                .from(phdRequestReviews)
                .where(eq(phdRequestReviews.reviewerRole, "HOD"));

            if (reviewedRequestIds.length === 0) {
                res.status(200).json([]);
            }

            requests = await db.query.phdRequests.findMany({
                where: inArray(
                    phdRequests.id,
                    reviewedRequestIds.map((r) => r.id)
                ),
                with: {
                    student: {
                        columns: { name: true, email: true },
                    },
                    supervisor: {
                        columns: { name: true, email: true },
                    },
                },
                orderBy: [desc(phdRequests.updatedAt)],
            });
        }

        res.status(200).json(requests);
    })
);

export default router;
