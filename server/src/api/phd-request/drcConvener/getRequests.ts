import { asyncHandler } from "@/middleware/routeHandler.ts";
import { checkAccess } from "@/middleware/auth.ts";
import express from "express";
import db from "@/config/db/index.ts";
import { phdRequests } from "@/config/db/schema/phdRequest.ts";
import { inArray, desc } from "drizzle-orm";
import { phdRequestSchemas } from "lib";

const router = express.Router();

router.get(
    "/",
    checkAccess(),
    asyncHandler(async (_req, res) => {
        const statusesForReview: (typeof phdRequestSchemas.phdRequestStatuses)[number][] =
            ["supervisor_submitted", "drc_convener_review"];

        const requests = await db.query.phdRequests.findMany({
            where: inArray(phdRequests.status, statusesForReview),
            with: {
                student: {
                    columns: {
                        name: true,
                        email: true,
                    },
                },
                supervisor: {
                    columns: {
                        name: true,
                        email: true,
                    },
                },
            },
            orderBy: [desc(phdRequests.updatedAt)],
        });

        res.status(200).json(requests);
    })
);

export default router;
