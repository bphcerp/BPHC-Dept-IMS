import express from "express";
import { z } from "zod";
import db from "@/config/db/index.ts";
import { qpReviewRequests } from "@/config/db/schema/qp.ts";
import { checkAccess } from "@/middleware/auth.ts";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import logger from "@/config/logger.ts";

const router = express.Router();

export const CourseSchema = z.object({
    icEmail: z.string().email("Invalid email address"),
    courseName: z.preprocess(
        (val) => String(val).trim(),
        z.string().min(1, "Course name is required")
    ),
    courseCode: z.preprocess(
        (val) => String(val).trim(),
        z.string().min(1, "Course code is required")
    ),
    category: z.enum(["HD", "FD"], {
        required_error: "Category must be either HD or FD",
    }),
});

export const createRequestSchema = z.object({
    courses: z.array(CourseSchema).nonempty("At least one course is required"),
    requestType: z.enum(["Mid Sem", "Comprehensive", "Both"], {
        required_error: "Request type is required",
    }),
});

router.post(
    "/",
    checkAccess(),
    asyncHandler(async (req, res) => {
        const result = createRequestSchema.safeParse(req.body);
        if (!result.success) {
            return res.status(400).json({
                success: false,
                message: "Validation failed",
                errors: result.error.errors,
            });
        }

        const { courses, requestType } = result.data;

        try {
            await db.insert(qpReviewRequests).values(
                courses.map((course) => ({
                    ...course,
                    requestType,
                }))
            );

            return res.status(201).json({
                success: true,
                message: "Requests created successfully",
                data: { courses, requestType },
            });
        } catch (error) {
            logger.error("Database insert failed:", error);

            return res.status(500).json({
                success: false,
                message: "Failed to create review requests",
                error: error instanceof Error ? error.message : error,
            });
        }
    })
);


export default router;
