import express from "express";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import { checkAccess } from "@/middleware/auth.ts";
import db from "@/config/db/index.ts";
import { phdExamApplications } from "@/config/db/schema/phd.ts";
import { HttpCode, HttpError } from "@/config/errors.ts";
import { eq, and } from "drizzle-orm";
import z from "zod";

const router = express.Router();

const finalSubmitSchema = z.object({
    applicationId: z.coerce.number().int().positive(),
});

router.post(
    "/",
    checkAccess(),
    asyncHandler(async (req, res) => {
        const body = finalSubmitSchema.parse(req.body);
        const userEmail = req.user!.email;

        // Find the application
        const application = await db.query.phdExamApplications.findFirst({
            where: and(
                eq(phdExamApplications.id, body.applicationId),
                eq(phdExamApplications.studentEmail, userEmail)
            ),
            with: {
                exam: true,
            },
        });

        if (!application) {
            throw new HttpError(HttpCode.NOT_FOUND, "Application not found");
        }

        if (application.status !== "draft") {
            throw new HttpError(
                HttpCode.BAD_REQUEST,
                "Only draft applications can be submitted"
            );
        }

        // Check if deadline has passed
        if (new Date(application.exam.submissionDeadline) < new Date()) {
            throw new HttpError(
                HttpCode.BAD_REQUEST,
                "The submission deadline has passed"
            );
        }

        // Validate required files are present
        const requiredFiles = [
            application.applicationFormFileId,
            application.qualifyingArea1SyllabusFileId,
            application.qualifyingArea2SyllabusFileId,
            application.tenthReportFileId,
            application.twelfthReportFileId,
            application.undergradReportFileId,
        ];

        if (requiredFiles.some((fileId) => !fileId)) {
            throw new HttpError(
                HttpCode.BAD_REQUEST,
                "All required documents must be uploaded before final submission"
            );
        }

        // Update status to applied
        await db
            .update(phdExamApplications)
            .set({
                status: "applied",
                updatedAt: new Date(),
            })
            .where(eq(phdExamApplications.id, body.applicationId));

        res.status(200).json({
            success: true,
            message: "Application submitted successfully",
        });
    })
);

export default router;
