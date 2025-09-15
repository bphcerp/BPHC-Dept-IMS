import express from "express";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import { checkAccess } from "@/middleware/auth.ts";
import db, { type Tx } from "@/config/db/index.ts";
import { phdExamApplications } from "@/config/db/schema/phd.ts";
import { files } from "@/config/db/schema/form.ts";
import { HttpCode, HttpError } from "@/config/errors.ts";
import { pdfUpload } from "@/config/multer.ts";
import { phdSchemas, modules } from "lib";
import multer from "multer";
import { eq, and } from "drizzle-orm";
import { phd } from "@/config/db/schema/admin.ts";

const router = express.Router();
type FileField = (typeof phdSchemas.fileFieldNames)[number];

const handleFileUploads = async (
    tx: Tx,
    req: express.Request,
    userEmail: string
): Promise<Partial<Record<FileField, number>>> => {
    if (Array.isArray(req.files)) throw new Error("Invalid files format");
    const uploadedFiles = req.files as
        | Record<string, Express.Multer.File[]>
        | undefined;
    const insertedFileIds: Partial<Record<FileField, number>> = {};
    if (uploadedFiles && Object.entries(uploadedFiles).length > 0) {
        const fileValues = Object.entries(uploadedFiles).map(
            ([fieldName, files]) => {
                const file = files[0];
                return {
                    userEmail,
                    filePath: file.path,
                    originalName: file.originalname,
                    mimetype: file.mimetype,
                    size: file.size,
                    fieldName,
                    module: modules[4],
                };
            }
        );
        if (fileValues.length > 0) {
            const insertedFiles = await tx
                .insert(files)
                .values(fileValues)
                .returning();
            insertedFiles.forEach((file) => {
                insertedFileIds[file.fieldName! as FileField] = file.id;
            });
        }
    }
    return insertedFileIds;
};

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
        const studentProfile = await db.query.phd.findFirst({
            where: eq(phd.email, userEmail),
        });

        if (!studentProfile) {
            throw new HttpError(
                HttpCode.NOT_FOUND,
                "Your PhD student profile was not found. Please contact an administrator."
            );
        }
        if (studentProfile.hasPassedQe) {
            throw new HttpError(
                HttpCode.FORBIDDEN,
                "You have already passed the qualifying exam and cannot apply again."
            );
        }
        if (studentProfile.qeAttemptCount >= 2) {
            throw new HttpError(
                HttpCode.FORBIDDEN,
                "You have reached the maximum number of attempts for the qualifying exam."
            );
        }

        const existingApplication =
            await db.query.phdExamApplications.findFirst({
                where: and(
                    eq(phdExamApplications.examId, body.examId),
                    eq(phdExamApplications.studentEmail, userEmail)
                ),
            });

        if (existingApplication) {
            if (
                existingApplication.status === "resubmit" &&
                body.applicationId === existingApplication.id
            ) {
                await db.transaction(async (tx) => {
                    const newFileIds = await handleFileUploads(
                        tx,
                        req,
                        userEmail
                    );
                    await tx
                        .update(phdExamApplications)
                        .set({
                            qualifyingArea1: body.qualifyingArea1,
                            qualifyingArea2: body.qualifyingArea2,
                            status: "applied",
                            comments: null,
                            applicationFormFileId:
                                newFileIds.applicationForm ??
                                existingApplication.applicationFormFileId,
                            qualifyingArea1SyllabusFileId:
                                newFileIds.qualifyingArea1Syllabus ??
                                existingApplication.qualifyingArea1SyllabusFileId,
                            qualifyingArea2SyllabusFileId:
                                newFileIds.qualifyingArea2Syllabus ??
                                existingApplication.qualifyingArea2SyllabusFileId,
                            tenthReportFileId:
                                newFileIds.tenthReport ??
                                existingApplication.tenthReportFileId,
                            twelfthReportFileId:
                                newFileIds.twelfthReport ??
                                existingApplication.twelfthReportFileId,
                            undergradReportFileId:
                                newFileIds.undergradReport ??
                                existingApplication.undergradReportFileId,
                            mastersReportFileId:
                                newFileIds.mastersReport ??
                                existingApplication.mastersReportFileId,
                        })
                        .where(eq(phdExamApplications.id, body.applicationId!));
                });
                res.status(200).json({
                    success: true,
                    message: "Application resubmitted successfully",
                });
            } else {
                throw new HttpError(
                    HttpCode.BAD_REQUEST,
                    "You have already submitted an application for this exam"
                );
            }
        } else {
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
            await db.transaction(async (tx) => {
                const insertedFileIds = await handleFileUploads(
                    tx,
                    req,
                    userEmail
                );
                await tx.insert(phdExamApplications).values({
                    examId: body.examId,
                    studentEmail: userEmail,
                    qualifyingArea1: body.qualifyingArea1,
                    qualifyingArea2: body.qualifyingArea2,
                    applicationFormFileId: insertedFileIds.applicationForm,
                    qualifyingArea1SyllabusFileId:
                        insertedFileIds.qualifyingArea1Syllabus,
                    qualifyingArea2SyllabusFileId:
                        insertedFileIds.qualifyingArea2Syllabus,
                    tenthReportFileId: insertedFileIds.tenthReport,
                    twelfthReportFileId: insertedFileIds.twelfthReport,
                    undergradReportFileId: insertedFileIds.undergradReport,
                    mastersReportFileId: insertedFileIds.mastersReport,
                    status: "applied",
                    attemptNumber: studentProfile.qeAttemptCount + 1,
                });
            });
            res.status(200).json({
                success: true,
                message: "Application submitted successfully",
            });
        }
    })
);

export default router;
