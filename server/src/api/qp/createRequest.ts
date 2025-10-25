import express from "express";
import { z } from "zod";
import db from "@/config/db/index.ts";
import { qpReviewRequests } from "@/config/db/schema/qp.ts";
import { checkAccess } from "@/middleware/auth.ts";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import logger from "@/config/logger.ts";
import { createRequestSchema } from "node_modules/lib/src/schemas/Qp.ts";

const router = express.Router();


router.post(
    "/",
    checkAccess(),
    asyncHandler(async (req, res) => {
        const result = createRequestSchema.safeParse(req.body);
        if (!result.success) {
            res.status(400).json({
                success: false,
                message: "Validation failed",
                errors: result.error.errors,
            });
            return;
        }

        const { courses, requestType } = result.data;

        try {
            await db.insert(qpReviewRequests).values(
                courses.map((course) => ({
                    ...course,
                    requestType,
                }))
            );

            res.status(201).json({
                success: true,
                message: "Requests created successfully",
                data: { courses, requestType },
            });
        } catch (error) {
            logger.error("Database insert failed:", error);

            res.status(500).json({
                success: false,
                message: "Failed to create review requests",
                error: error instanceof Error ? error.message : error,
            });
        }
    })
);

export default router;
