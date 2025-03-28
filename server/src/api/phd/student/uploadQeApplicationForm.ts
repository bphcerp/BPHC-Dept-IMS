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
    asyncHandler((req: Request, res: Response, next: NextFunction) =>
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

        // Safely parse dates
        const parseDate = (dateString: string | undefined): Date | null => {
            if (!dateString) return null;
            const parsedDate = new Date(dateString);
            return !isNaN(parsedDate.getTime()) ? parsedDate : null;
        };

        const examStartDate = parseDate(
            (req.body as { examStartDate: string }).examStartDate
        );
        const examEndDate = parseDate(
            (req.body as { examEndDate: string }).examEndDate
        );

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

        const {
            qualifyingArea1,
            qualifyingArea2,
            examStartDate: parsedStartDate,
            examEndDate: parsedEndDate,
        } = parsed.data;

        const { email } = req.user;

        await db.transaction(async (tx) => {
            const student = await tx.query.phd.findFirst({
                where: eq(phd.email, email),
            });

            if (!student) {
                throw new HttpError(
                    HttpCode.NOT_FOUND,
                    "Student record not found"
                );
            }

            let shouldIncrementApplicationCount = true;
            if (
                (student.qualifyingExam1StartDate?.toISOString() ===
                    new Date(parsedStartDate).toISOString() &&
                    student.qualifyingExam1EndDate?.toISOString() ===
                        new Date(parsedEndDate).toISOString()) ||
                (student.qualifyingExam2StartDate?.toISOString() ===
                    new Date(parsedStartDate).toISOString() &&
                    student.qualifyingExam2EndDate?.toISOString() ===
                        new Date(parsedEndDate).toISOString())
            ) {
                shouldIncrementApplicationCount = false;
            }

            const updateFields: Record<string, string | Date | number> = {
                qualifyingArea1,
                qualifyingArea2,
                qualifyingAreasUpdatedAt: new Date(),
            };

            if (shouldIncrementApplicationCount) {
                updateFields.numberOfQeApplication =
                    (student.numberOfQeApplication ?? 0) + 1;
                if (!student.qualifyingExam1StartDate) {
                    updateFields.qualifyingExam1StartDate = new Date(
                        parsedStartDate
                    );
                    updateFields.qualifyingExam1EndDate = new Date(
                        parsedEndDate
                    );
                } else if (!student.qualifyingExam2StartDate) {
                    updateFields.qualifyingExam2StartDate = new Date(
                        parsedStartDate
                    );
                    updateFields.qualifyingExam2EndDate = new Date(
                        parsedEndDate
                    );
                } else {
                    throw new HttpError(
                        HttpCode.BAD_REQUEST,
                        "Maximum number of qualifying exam attempts reached"
                    );
                }
            }

            await tx
                .insert(applications)
                .values({
                    module: modules[4],
                    userEmail: email,
                    status: "pending",
                })
                .returning();

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

            await tx.insert(fileFields).values({
                fileId: fileRecord.id,
                module: modules[4],
                userEmail: email,
                fieldName: "qualificationForm",
            });

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

            await tx.update(phd).set(updateFields).where(eq(phd.email, email));
        });

        res.status(HttpCode.OK).json({
            success: true,
            message: "Qualification exam application submitted successfully",
        });
    })
);

export default router;
