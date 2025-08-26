import db from "@/config/db/index.ts";
import { checkAccess } from "@/middleware/auth.ts";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import express from "express";
import JSZip from "jszip";
import ExcelJS from "exceljs";
import { promises as fs } from "fs";
import logger from "@/config/logger.ts";

function generateExcel(
    headers: string[],
    data: Record<string, string | number | undefined>[]
) {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Sheet1");
    worksheet.addRow(headers);
    for (const row of data) {
        const rowData = headers.map((h) => row[h]);
        worksheet.addRow(rowData);
    }
    return workbook;
}

const router = express.Router();

router.get(
    "/",
    checkAccess(),
    asyncHandler(async (_req, res, _next) => {
        const headers = [
            "S.No",
            "Course Code",
            "Course Name",
            "Instructor In Charge",
            "Scope And Objective is written clearly",
            "Textbook(s) prescribed is of good repute for the course and approved by DCA",
            "Lecture wise Plan along with Learning Objectives is articulated in detail",
            "Lecture wise Plan is covering all the topics as per the course description given in the bulletin",
            "Number of Lectures/Practical are adequate as per the Units of the Course",
            "Evaluation Scheme is as per academic regulations",
        ];

        const allHandouts = await db.query.courseHandoutRequests.findMany({
            where: (handout, { eq }) => eq(handout.status, "approved"),
            with: {
                ic: {
                    with: {
                        faculty: true,
                    },
                },
            },
        });

        const transformHandoutData = (
            handout: (typeof allHandouts)[number],
            index: number
        ) => ({
            [headers[0]]: index + 1,
            [headers[1]]: handout.courseCode,
            [headers[2]]: handout.courseName,
            [headers[3]]: handout.ic?.faculty?.name,
            [headers[4]]:
                handout.scopeAndObjective == true ? "\u2713" : "\u00D7",
            [headers[5]]:
                handout.textBookPrescribed == true ? "\u2713" : "\u00D7",
            [headers[6]]:
                handout.lecturewisePlanLearningObjective == true
                    ? "\u2713"
                    : "\u00D7",
            [headers[7]]:
                handout.lecturewisePlanCourseTopics == true
                    ? "\u2713"
                    : "\u00D7",
            [headers[8]]: handout.numberOfLP == true ? "\u2713" : "\u00D7",
            [headers[9]]:
                handout.evaluationScheme == true ? "\u2713" : "\u00D7",
        });

        const hdHandoutsData = allHandouts
            .filter((handout) => handout.category === "HD")
            .map(transformHandoutData);

        const fdHandoutsData = allHandouts
            .filter((handout) => handout.category === "FD")
            .map(transformHandoutData);

        const sanitizeData = (
            data: Record<string, string | number | null | undefined>[]
        ): Record<string, string | number | undefined>[] =>
            data.map((row) => {
                const sanitized: Record<string, string | number | undefined> =
                    {};
                for (const key in row) {
                    sanitized[key] = row[key] === null ? undefined : row[key];
                }
                return sanitized;
            });

        const hdWorkbook = generateExcel(headers, sanitizeData(hdHandoutsData));
        const fdWorkbook = generateExcel(headers, sanitizeData(fdHandoutsData));

        const hdBuffer = await hdWorkbook.xlsx.writeBuffer();
        const fdBuffer = await fdWorkbook.xlsx.writeBuffer();

        const zip = new JSZip();
        zip.file("hd_handout_summary.xlsx", hdBuffer);
        zip.file("fd_handout_summary.xlsx", fdBuffer);

        const handouts = await db.query.courseHandoutRequests.findMany({
            columns: {
                handoutFilePath: false,
            },
            where: (handout, { eq }) => eq(handout.status, "approved"),
            with: {
                handoutFilePath: {
                    columns: {
                        filePath: true,
                    },
                },
            },
        });

        for (const handout of handouts) {
            const filePath = handout.handoutFilePath?.filePath;
            if (!filePath) continue;
            try {
                const pdfBuffer = await fs.readFile(filePath);
                const fileNameSafe =
                    `${handout.courseCode}_${handout.courseName}`
                        .replace(/[^\w\s-]/g, "")
                        .replace(/\s+/g, "_")
                        .toLowerCase();
                zip.file(
                    `${handout.category.toLowerCase()}_handouts/${fileNameSafe}.pdf`,
                    pdfBuffer
                );
            } catch (err) {
                logger.error(
                    `Failed to download or zip handout file: ${filePath}\n${(err as Error)?.stack}`
                );
            }
        }

        const zipBuffer = await zip.generateAsync({ type: "nodebuffer" });

        res.setHeader("Content-Type", "application/zip");
        res.setHeader(
            "Content-Disposition",
            "attachment; filename=handout_summary.zip"
        );
        res.status(200).send(zipBuffer);
    })
);

export default router;
