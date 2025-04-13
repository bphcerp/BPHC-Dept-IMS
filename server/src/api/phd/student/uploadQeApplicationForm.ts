import express from "express";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import { checkAccess } from "@/middleware/auth.ts";
import db from "@/config/db/index.ts";
import { phd } from "@/config/db/schema/admin.ts";
import {
    applications,
    textFields,
    files,
    fileFields,
} from "@/config/db/schema/form.ts";
import { eq } from "drizzle-orm";
import assert from "assert";
import { phdSchemas } from "lib";
import { pdfUpload } from "@/config/multer.ts";
import multer from "multer";
import { HttpCode, HttpError } from "@/config/errors.ts";
import { modules } from "lib";
import type { Request, Response, NextFunction } from "express";

const router = express.Router();

router.post(
    "/",
    checkAccess(),
    asyncHandler(async (req: Request, res: Response, next: NextFunction) =>
        pdfUpload.single("qualificationForm")(req, res, (err) => {
            if (err instanceof multer.MulterError)
                return next(new HttpError(HttpCode.BAD_REQUEST, err.message));
            next(err);
        })
    ),
    asyncHandler(async (req, res) => {
        assert(req.user);
        const file = req.file;
        if (!file) {
            throw new HttpError(HttpCode.BAD_REQUEST, "PDF file is required");
        }

        const parseDate = (dateString: string | undefined): Date | null => {
            if (!dateString) return null;
            const parsedDate = new Date(dateString);
            return !isNaN(parsedDate.getTime()) ? parsedDate : null;
        };

        const examId = parseInt(req.body.examId || "0", 10);
        if (!examId) {
            throw new HttpError(HttpCode.BAD_REQUEST, "Exam ID is required");
        }

        const examStartDate = parseDate(req.body.examStartDate);
        const examEndDate = parseDate(req.body.examEndDate);
        if (!examStartDate || !examEndDate) {
            throw new HttpError(HttpCode.BAD_REQUEST, "Invalid exam dates");
        }

        const parsed = phdSchemas.uploadApplicationSchema.safeParse({
            ...req.body,
            fileUrl: file.path,
            formName: file.originalname,
            applicationType: "qualifying_exam",
            examStartDate: examStartDate.toISOString(),
            examEndDate: examEndDate.toISOString(),
        });

        if (!parsed.success) {
            throw new HttpError(
                HttpCode.BAD_REQUEST,
                "Invalid input data: " + parsed.error.message
            );
        }

        const { qualifyingArea1, qualifyingArea2 } = parsed.data;
        const { email } = req.user;

        await db.transaction(async (tx) => {
            // Get the student record
            const student = await tx.query.phd.findFirst({
                where: eq(phd.email, email),
            });

            if (!student) {
                throw new HttpError(
                    HttpCode.NOT_FOUND,
                    "Student record not found"
                );
            }

            // Helper function to compare dates with tolerance for timezone differences
            const areSameDates = (
                date1: Date | null | undefined,
                date2: Date | null
            ): boolean => {
                if (!date1 || !date2) return false;

                // Convert to ISO string date parts only for comparison
                return (
                    date1.toISOString().split("T")[0] ===
                    date2.toISOString().split("T")[0]
                );
            };

            // Check if this is a resubmission for an existing attempt
            const isResubmissionForAttempt1 =
                student.qualifyingExam1StartDate &&
                student.qualifyingExam1EndDate &&
                areSameDates(student.qualifyingExam1StartDate, examStartDate) &&
                areSameDates(student.qualifyingExam1EndDate, examEndDate);

            const isResubmissionForAttempt2 =
                student.qualifyingExam2StartDate &&
                student.qualifyingExam2EndDate &&
                areSameDates(student.qualifyingExam2StartDate, examStartDate) &&
                areSameDates(student.qualifyingExam2EndDate, examEndDate);

            const isResubmission =
                isResubmissionForAttempt1 || isResubmissionForAttempt2;

            // Current application count
            const currentApplicationCount = student.numberOfQeApplication ?? 0;

            // If this is a new application (not resubmission), check max attempts
            if (!isResubmission && currentApplicationCount >= 2) {
                throw new HttpError(
                    HttpCode.BAD_REQUEST,
                    "Maximum number of qualifying exam attempts reached"
                );
            }

            // Prepare update fields
            const updateFields: Record<string, unknown> = {
                qualifyingArea1,
                qualifyingArea2,
                qualifyingAreasUpdatedAt: new Date(),
            };

            // Determine which attempt this is for
            if (isResubmissionForAttempt1) {
                // Just update the areas for attempt 1
            } else if (isResubmissionForAttempt2) {
                // Just update the areas for attempt 2
            } else {
                // This is a new application
                if (currentApplicationCount === 0) {
                    // First attempt
                    updateFields.numberOfQeApplication = 1;
                    updateFields.qualifyingExam1StartDate = examStartDate;
                    updateFields.qualifyingExam1EndDate = examEndDate;
                } else if (currentApplicationCount === 1) {
                    // Second attempt
                    updateFields.numberOfQeApplication = 2;
                    updateFields.qualifyingExam2StartDate = examStartDate;
                    updateFields.qualifyingExam2EndDate = examEndDate;
                }
            }

            // Insert application record
            await tx
                .insert(applications)
                .values({
                    module: modules[4],
                    userEmail: email,
                    status: "pending",
                })
                .returning();

            // Insert file record
            const [fileRecord] = await tx
                .insert(files)
                .values({
                    userEmail: email,
                    filePath: file.path,
                    originalName: file.originalname,
                    mimetype: file.mimetype,
                    size: file.size,
                    fieldName: "qualificationForm",
                    module: modules[4],
                })
                .returning();

            // Insert file field record
            await tx.insert(fileFields).values({
                fileId: fileRecord.id,
                module: modules[4],
                userEmail: email,
                fieldName: "qualificationForm",
            });

            // Insert text fields
            await tx.insert(textFields).values([
                {
                    value: qualifyingArea1,
                    userEmail: email,
                    module: modules[4],
                    fieldName: "qualifyingArea1",
                },
                {
                    value: qualifyingArea2,
                    userEmail: email,
                    module: modules[4],
                    fieldName: "qualifyingArea2",
                },
            ]);

            // Update the PhD record
            await tx.update(phd).set(updateFields).where(eq(phd.email, email));
        });

        res.status(HttpCode.OK).json({
            success: true,
            message: "Qualification exam application submitted successfully",
        });
    })
);

export default router;
