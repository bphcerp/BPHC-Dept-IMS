import express from "express";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import { checkAccess } from "@/middleware/auth.ts";
import db from "@/config/db/index.ts";
import { phdExamApplications } from "@/config/db/schema/phd.ts";
import { files } from "@/config/db/schema/form.ts";
import { HttpCode, HttpError } from "@/config/errors.ts";
import { pdfUpload } from "@/config/multer.ts";
import { phdSchemas, modules } from "lib";
import multer from "multer";

const router = express.Router();

type FileField = (typeof phdSchemas.fileFieldNames)[number];

router.post(
    "/",
    checkAccess(),
    asyncHandler((req, res, next) =>
        pdfUpload.fields(phdSchemas.multerFileFields)(req, res, (err) => {
            if (err instanceof multer.MulterError)
                return next(new HttpError(HttpCode.BAD_REQUEST, err.message));
            next(err);
        })
    ),
    asyncHandler(async (req, res) => {
        const body = phdSchemas.qualifyingExamApplicationSchema.parse(req.body);
        const userEmail = req.user!.email;

        // Verify exam exists and is still accepting applications
        const exam = await db.query.phdQualifyingExams.findFirst({
            where: (table, { eq, and, gt }) =>
                and(
                    eq(table.id, body.examId),
                    gt(table.submissionDeadline, new Date())
                ),
        });

        if (!exam) {
            throw new HttpError(
                HttpCode.BAD_REQUEST,
                "Exam not found or application deadline has passed"
            );
        }

        // Check if user already applied for this exam
        const existingApplication =
            await db.query.phdExamApplications.findFirst({
                where: (table, { eq, and }) =>
                    and(
                        eq(table.examId, body.examId),
                        eq(table.studentEmail, userEmail)
                    ),
            });

        if (existingApplication) {
            throw new HttpError(
                HttpCode.BAD_REQUEST,
                "You have already submitted an application for this exam"
            );
        }

        // Process file uploads
        await db.transaction(async (tx) => {
            if (Array.isArray(req.files)) throw new Error("Invalid files");
            const insertedFileIds: Partial<Record<FileField, number>> = {};

            if (req.files && Object.entries(req.files).length) {
                const insertedFiles = await tx
                    .insert(files)
                    .values(
                        Object.entries(req.files).map(([fieldName, files]) => {
                            const file = files[0];
                            return {
                                userEmail: req.user!.email,
                                filePath: file.path,
                                originalName: file.originalname,
                                mimetype: file.mimetype,
                                size: file.size,
                                fieldName,
                                module: modules[4], // PhD module
                            };
                        })
                    )
                    .returning();
                insertedFiles.forEach((file) => {
                    insertedFileIds[file.fieldName! as FileField] = file.id;
                });
            }

            // Create the application record
            await tx.insert(phdExamApplications).values({
                examId: body.examId,
                studentEmail: userEmail,
                qualifyingArea1: body.qualifyingArea1,
                qualifyingArea2: body.qualifyingArea2,
                qualifyingArea1SyllabusFileId:
                    insertedFileIds.qualifyingArea1Syllabus,
                qualifyingArea2SyllabusFileId:
                    insertedFileIds.qualifyingArea2Syllabus,
                tenthReportFileId: insertedFileIds.tenthReport,
                twelfthReportFileId: insertedFileIds.twelfthReport,
                undergradReportFileId: insertedFileIds.undergradReport,
                mastersReportFileId: insertedFileIds.mastersReport,
                status: "applied",
            });
        });

        res.status(200).json({
            success: true,
            message: "Application submitted successfully",
        });
    })
);

export default router;
