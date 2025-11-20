import express from "express";
import fs from "fs/promises";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import { checkAccess } from "@/middleware/auth.ts";
import { HttpError, HttpCode } from "@/config/errors.ts";
import db from "@/config/db/index.ts";
import { phdExamApplications } from "@/config/db/schema/phd.ts";
import { eq, and, inArray } from "drizzle-orm";
import puppeteer from "puppeteer";
import JSZip from "jszip";
import Mustache from "mustache";

const router = express.Router();

const printListTemplate = `<!doctype html>
<html> <head> <meta charset="UTF-8" /> <title>Intimation to AGSRD for PhD Qualifying Examination</title> <style> body{margin: 40px; line-height: 1.5;}.underline{border-bottom: 1px solid display: inline-block; width: 200px; margin: 0 5px;}table{width: 100%; margin-bottom: 20px;}table, th, td{border: 1px solid}th, td{padding: 8px; text-align: center; vertical-align: middle;}.multiline-header{line-height: 1.2;}.header-section{text-align: center; margin-bottom: 20px;}@media print { thead { display: table-header-group; } tr { page-break-inside: avoid; } }</style> </head> <body> <div class="header-section"> <h2>Intimation to AGSRD for PhD Qualifying Examination</h2> <p> BIRLA INSTITUTE OF TECHNOLOGY AND SCIENCE PILANI,<br /> CAMPUS<br /> DEPARTMENT OF &emsp; </p> <p>Date: {{currentDate}}</p> <p> To,<br /> Associate Dean, AGSRD<br /> BITS Pilani, &emsp; campus. </p> <p> The Department will be conducting PhD qualifying examination as per following- </p> </div> <p> 1. Date of Examination - From. <span class="underline">{{examStartDate}}</span> to. <span class="underline">{{examEndDate}}</span> </p> <p>2. Room number - <span class="underline">___________</span></p> <p>3. List of candidates who will be appearing in the examination-</p> <table> <thead> <tr> <th>Sl No</th> <th class="multiline-header"> ID No/<br /> Application No/<br /> PSRN </th> <th>Name</th> <th class="multiline-header"> First attempt/<br /> second Attempt </th> <th class="multiline-header"> Name of two PhD<br /> qualifying areas </th> </tr> </thead> <tbody> {{#rows}} <tr> <td>{{slNo}}</td> <td>{{id}}</td> <td>{{name}}</td> <td>{{attempt}}</td> <td> 1. {{area1}}<br /> 2. {{area2}}</td> </tr> {{/rows}}</tbody> </table> <br /> <p>(Name)<br />(DRC Convener)<br /> Date: {{date}}</p> <br /> <p>(Name)<br />(HOD)<br /> Date: {{date}}</p> </body>
</html>`;

router.post(
    "/",
    checkAccess(),
    asyncHandler(async (req, res, next) => {
        const { applicationIds, format } = req.body;
        if (
            !applicationIds ||
            !Array.isArray(applicationIds) ||
            applicationIds.length === 0
        ) {
            throw new HttpError(
                HttpCode.BAD_REQUEST,
                "Application IDs array is required"
            );
        }

        if (format === "print") {
            const applications = await db.query.phdExamApplications.findMany({
                where: and(
                    inArray(phdExamApplications.id, applicationIds),
                    eq(phdExamApplications.status, "verified")
                ),
                with: { student: true, exam: true },
            });
            if (applications.length === 0) {
                next(
                    new HttpError(
                        HttpCode.NOT_FOUND,
                        "No verified applications found."
                    )
                );
            }

            const exam = applications[0]?.exam;
            const rows = applications.map((app, index) => ({
                slNo: index + 1,
                id: app.student.idNumber || app.student.erpId || "N/A",
                name: app.student.name || "N/A",
                attempt: "First attempt",
                area1: app.qualifyingArea1 || "N/A",
                area2: app.qualifyingArea2 || "N/A",
            }));
            const data = {
                currentDate: new Date().toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                }),
                examStartDate: exam?.examStartDate
                    ? new Date(exam.examStartDate).toLocaleDateString()
                    : "___________",
                examEndDate: exam?.examEndDate
                    ? new Date(exam.examEndDate).toLocaleDateString()
                    : "___________",
                date: new Date().toLocaleDateString(),
                rows,
            };

            const browser = await puppeteer.launch({
                headless: true,
                args: ["--no-sandbox"],
            });
            try {
                const page = await browser.newPage();
                const htmlContent = Mustache.render(printListTemplate, data);
                await page.setContent(htmlContent, {
                    waitUntil: "networkidle0",
                });
                const pdf = await page.pdf({
                    format: "A4",
                    printBackground: true,
                });
                res.setHeader("Content-Type", "application/pdf").end(pdf);
            } finally {
                await browser.close();
            }
        } else {
            const applicationsWithFiles =
                await db.query.phdExamApplications.findMany({
                    where: and(
                        inArray(phdExamApplications.id, applicationIds),
                        eq(phdExamApplications.status, "verified")
                    ),
                    with: {
                        student: { columns: { name: true, erpId: true } },
                        applicationFormFile: true,
                        courseworkGradeSheetFile: true,
                        qualifyingArea1SyllabusFile: true,
                        qualifyingArea2SyllabusFile: true,
                        tenthReportFile: true,
                        twelfthReportFile: true,
                        undergradReportFile: true,
                        mastersReportFile: true,
                    },
                });

            if (applicationsWithFiles.length === 0) {
                throw new HttpError(
                    HttpCode.NOT_FOUND,
                    "No verified applications with files found."
                );
            }

            const zip = new JSZip();

            for (const app of applicationsWithFiles) {
                const studentIdentifier =
                    app.student.erpId ||
                    app.student.name ||
                    `student_${app.id}`;
                const studentFolder = zip.folder(studentIdentifier);
                if (!studentFolder) continue;

                const fileFields = [
                    { name: "Application-Form", file: app.applicationFormFile },
                    {
                        name: "Coursework-Grade-Sheet",
                        file: app.courseworkGradeSheetFile,
                    },
                    {
                        name: "Syllabus-Area1",
                        file: app.qualifyingArea1SyllabusFile,
                    },
                    {
                        name: "Syllabus-Area2",
                        file: app.qualifyingArea2SyllabusFile,
                    },
                    { name: "10th-Report", file: app.tenthReportFile },
                    { name: "12th-Report", file: app.twelfthReportFile },
                    { name: "UG-Report", file: app.undergradReportFile },
                    { name: "Masters-Report", file: app.mastersReportFile },
                ];

                for (const field of fileFields) {
                    if (field.file) {
                        try {
                            const fileBuffer = await fs.readFile(
                                field.file.filePath
                            );
                            studentFolder.file(`${field.name}.pdf`, fileBuffer);
                        } catch (error) {
                            console.warn(
                                `Could not read file ${field.file.filePath} for application ${app.id}. Skipping.`
                            );
                        }
                    }
                }
            }

            const zipBuffer = await zip.generateAsync({ type: "nodebuffer" });
            const zipName = `Qualifying-Exam-Documents-${new Date().toISOString().split("T")[0]}.zip`;
            res.setHeader("Content-Type", "application/zip");
            res.setHeader(
                "Content-Disposition",
                `attachment; filename="${zipName}"`
            );
            res.end(zipBuffer);
        }
    })
);

export default router;
