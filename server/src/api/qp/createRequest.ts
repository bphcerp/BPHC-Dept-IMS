import db from "@/config/db/index.ts";
import { qpReviewRequests } from "@/config/db/schema/qp.ts";
import { checkAccess } from "@/middleware/auth.ts";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import express from "express";
import { z } from "zod";

const router = express.Router();

const createRequestSchema = z.object({
    icEmail: z.string().email(),
    courseName: z.string(),
    courseCode: z.string(),
    requestType: z.enum(["Mid Sem", "Comprehensive", "Both"]),
    category: z.enum(["HD", "FD"]),
});

router.post(
    "/",
    checkAccess(),
    asyncHandler(async (req, res) => {
        const result = createRequestSchema.safeParse(req.body);
        if (!result.success) {
            res.status(400).json({ errors: result.error.errors });
            return;
        }

        const createdRequest = await db.insert(qpReviewRequests).values({
            icEmail: result.data.icEmail,
            courseName: result.data.courseName,
            courseCode: result.data.courseCode,
            requestType: result.data.requestType,
            category: result.data.category,
        });

        if (!createdRequest) {
            res.status(500).json({ message: "Failed to create request" });
            return;
        }

        res.status(200).json({
            success: true,
            message: "Request created successfully",
            data: result.data,
        });
    })
);

export default router;
