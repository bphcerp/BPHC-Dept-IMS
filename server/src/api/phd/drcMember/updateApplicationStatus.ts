import express from "express";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import { checkAccess } from "@/middleware/auth.ts";
import { HttpError, HttpCode } from "@/config/errors.ts";
import db from "@/config/db/index.ts";
import { phdExamApplications } from "@/config/db/schema/phd.ts";
import { eq } from "drizzle-orm";
import z from "zod";

const router = express.Router();

const updateApplicationStatusSchema = z.object({
    status: z.enum(["applied", "accepted", "rejected", "withdrawn"]),
    comments: z.string().optional(),
});

export default router.patch(
    "/:applicationId",
    checkAccess(),
    asyncHandler(async (req, res, next) => {
        const { applicationId } = req.params;

        if (!applicationId || isNaN(parseInt(applicationId))) {
            return next(
                new HttpError(HttpCode.BAD_REQUEST, "Invalid application ID")
            );
        }

        const parseResult = updateApplicationStatusSchema.safeParse(req.body);
        if (!parseResult.success) {
            return next(
                new HttpError(HttpCode.BAD_REQUEST, "Invalid request body")
            );
        }

        const { status, comments } = parseResult.data;

        // Check if application exists
        const existingApplication = await db
            .select({ id: phdExamApplications.id })
            .from(phdExamApplications)
            .where(eq(phdExamApplications.id, parseInt(applicationId)))
            .limit(1);

        if (!existingApplication.length) {
            return next(
                new HttpError(HttpCode.NOT_FOUND, "Application not found")
            );
        }

        // Update the application status
        await db
            .update(phdExamApplications)
            .set({
                status,
                comments: comments || null,
                updatedAt: new Date(),
            })
            .where(eq(phdExamApplications.id, parseInt(applicationId)));

        res.json({
            success: true,
            message: `Application ${status} successfully`,
        });
    })
);
