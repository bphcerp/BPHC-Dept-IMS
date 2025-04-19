import express from "express";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import { checkAccess } from "@/middleware/auth.ts";
import { HttpError, HttpCode } from "@/config/errors.ts";
import db from "@/config/db/index.ts";
import { phd } from "@/config/db/schema/admin.ts";
import { fileFields, applications, files } from "@/config/db/schema/form.ts";
import { phdQualifyingExams } from "@/config/db/schema/phd.ts";
import { eq, and, desc, sql } from "drizzle-orm";
import { modules } from "lib";
import fs from "fs";
import JSZip from "jszip";

const router = express.Router();

export default router.get(
    "/",
    checkAccess(),
    asyncHandler(async (req, res, next) => {
        try {
            // Validate exam ID from query parameter instead of path parameter
            const examId = parseInt((req.query.examId as string) || "0", 10);
            if (!examId || isNaN(examId)) {
                return next(
                    new HttpError(
                        HttpCode.BAD_REQUEST,
                        "Valid exam ID is required"
                    )
                );
            }

            // Get exam details
            const exam = await db.query.phdQualifyingExams.findFirst({
                where: eq(phdQualifyingExams.id, examId),
            });

            if (!exam) {
                return next(
                    new HttpError(
                        HttpCode.NOT_FOUND,
                        "Qualifying exam not found"
                    )
                );
            }

            // Define the time window for applications
            const deadlineDate = new Date(exam.deadline);
            const threeMonthsBefore = new Date(deadlineDate);
            threeMonthsBefore.setMonth(deadlineDate.getMonth() - 3);

            // Get distinct students with their most recent application within the time window
            const studentsWithRecentApp = await db
                .select({
                    email: phd.email,
                    name: phd.name,
                    erpId: phd.erpId,
                    maxCreatedAt: sql`MAX(${applications.createdAt})`.as(
                        "maxCreatedAt"
                    ),
                })
                .from(phd)
                .innerJoin(applications, eq(phd.email, applications.userEmail))
                .where(
                    and(
                        eq(applications.module, modules[4]),
                        sql`${applications.createdAt} BETWEEN ${threeMonthsBefore} AND ${deadlineDate}`
                    )
                )
                .groupBy(phd.email, phd.name, phd.erpId);

            if (studentsWithRecentApp.length === 0) {
                return next(
                    new HttpError(
                        HttpCode.NOT_FOUND,
                        "No applications found for this exam"
                    )
                );
            }

            // Create a new zip file
            const zip = new JSZip();

            // Create a folder with exam name and date
            const folderName = `${exam.examName.replace(/\s+/g, "_")}_${deadlineDate.toISOString().split("T")[0]}`;
            const folder = zip.folder(folderName);

            if (!folder) {
                return next(
                    new HttpError(
                        HttpCode.INTERNAL_SERVER_ERROR,
                        "Failed to create zip folder"
                    )
                );
            }

            // Track student files we couldn't process
            const failedFiles = [];

            // Add each student's form to the zip
            for (const student of studentsWithRecentApp) {
                try {
                    // Get the most recent qualification form file for this student
                    const qualificationForm = await db
                        .select({
                            id: files.id,
                            fileName: files.originalName,
                            filePath: files.filePath,
                        })
                        .from(fileFields)
                        .innerJoin(files, eq(fileFields.fileId, files.id))
                        .where(
                            and(
                                eq(fileFields.userEmail, student.email),
                                eq(fileFields.fieldName, "qualificationForm"),
                                eq(fileFields.module, modules[4])
                            )
                        )
                        .orderBy(desc(files.createdAt))
                        .limit(1);

                    if (qualificationForm.length > 0) {
                        const file = qualificationForm[0];

                        // Check if file exists on disk
                        if (fs.existsSync(file.filePath)) {
                            try {
                                // Read the file and add it to the zip
                                const fileData = fs.readFileSync(file.filePath);

                                // Use student email (which is guaranteed to exist) for file naming
                                const sanitizedEmail = student.email.replace(
                                    /[^a-z0-9]/gi,
                                    "_"
                                );
                                const fileName = `${sanitizedEmail}_${student.erpId || "noID"}_${file.fileName}`;

                                folder.file(fileName, fileData);
                            } catch (error) {
                                console.error(
                                    `Error reading file for ${student.email}:`,
                                    error
                                );
                                failedFiles.push({
                                    name: student.name || student.email,
                                    erpId: student.erpId || "N/A",
                                    reason: "File read error",
                                });
                            }
                        } else {
                            failedFiles.push({
                                name: student.name || student.email,
                                erpId: student.erpId || "N/A",
                                reason: "File not found on disk",
                            });
                        }
                    } else {
                        failedFiles.push({
                            name: student.name || student.email,
                            erpId: student.erpId || "N/A",
                            reason: "No application form found",
                        });
                    }
                } catch (error) {
                    console.error(
                        `Error processing student ${student.email}:`,
                        error
                    );
                    failedFiles.push({
                        name: student.name || student.email,
                        erpId: student.erpId || "N/A",
                        reason: "Processing error",
                    });
                }
            }

            // Add a summary text file if there were any failures
            if (failedFiles.length > 0) {
                let summaryContent =
                    "The following files could not be included in the ZIP:\n\n";
                failedFiles.forEach((file) => {
                    summaryContent += `${file.name} (${file.erpId}): ${file.reason}\n`;
                });
                folder.file("_SUMMARY_MISSING_FILES.txt", summaryContent);
            }

            try {
                // Generate the zip file
                const zipContent = await zip.generateAsync({
                    type: "nodebuffer",
                });

                // Set content disposition and type for browser download
                res.setHeader(
                    "Content-Disposition",
                    `attachment; filename="${folderName}.zip"`
                );
                res.setHeader("Content-Type", "application/zip");

                // Send the zip file
                res.send(zipContent);
            } catch (error) {
                console.error("Error generating ZIP file:", error);
                return next(
                    new HttpError(
                        HttpCode.INTERNAL_SERVER_ERROR,
                        "Failed to generate ZIP file"
                    )
                );
            }
        } catch (error) {
            console.error("Error in batch download endpoint:", error);
            return next(
                new HttpError(
                    HttpCode.INTERNAL_SERVER_ERROR,
                    "An error occurred while processing your request"
                )
            );
        }
    })
);
