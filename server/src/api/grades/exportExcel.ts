import { Router } from "express";
import { checkAccess } from "@/middleware/auth.ts";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import { HttpCode, HttpError } from "@/config/errors.ts";
import * as XLSX from "xlsx";
import { z } from "zod";
import db from "@/config/db/index.ts";
import { files as filesTable } from "@/config/db/schema/form.ts";
import { inArray } from "drizzle-orm";
import JSZip from "jszip";
import { promises as fs } from "node:fs";
import path from "node:path";

const router = Router();

const exportExcelSchema = z.object({
    fileName: z.string(),
    sheets: z.array(
        z.object({
            sheetName: z.string(),
            headerRows: z.number(),
            columnHeaders: z.array(
                z.object({
                    name: z.string(),
                    type: z.enum([
                        "text",
                        "number",
                        "grade",
                        "select",
                        "serial",
                    ]),
                    options: z.array(z.string()).optional(),
                })
            ),
            studentData: z.array(z.record(z.any())),
            extraContent: z.array(z.array(z.any())).optional(),
        })
    ),
});

const ERP_ID_CANDIDATES = [
    "erp id",
    "erp",
    "emplid",
    "campus id",
    "id",
    "reg no",
    "registration",
];

const INVALID_PATH_CHARS = /[<>:"/\\|?*\x00-\x1F]/g;

const sanitizePathSegment = (input: string, fallback: string) => {
    const sanitized = input.replace(INVALID_PATH_CHARS, "_").trim();
    if (!sanitized) return fallback;
    if (sanitized === "." || sanitized === "..") return fallback;
    return sanitized;
};

const normalizeIdentifier = (value: unknown): string | null => {
    if (value === null || value === undefined) return null;
    if (typeof value === "string") {
        const trimmed = value.trim();
        return trimmed.length > 0 ? trimmed : null;
    }
    if (typeof value === "number") {
        return String(value);
    }
    return null;
};

const parseNumericId = (value: unknown): number | null => {
    if (value === null || value === undefined) return null;
    const num = Number(value);
    return Number.isFinite(num) ? num : null;
};

const getFileExtension = (
    originalName: string | null | undefined,
    filePath: string
) => {
    const candidate =
        originalName && originalName.trim().length > 0
            ? originalName
            : filePath;
    const ext = path.extname(candidate);
    return ext && ext.length > 0 ? ext : ".pdf";
};

router.post(
    "/",
    checkAccess("grades:export"),
    asyncHandler(async (req, res, next) => {
        try {
            const excelData = exportExcelSchema.parse(req.body);

            const workbook = XLSX.utils.book_new();
            const sheetMetadata: {
                sheetName: string;
                students: {
                    erpId: string | null;
                    midsemDocFileId: number | null;
                    endsemDocFileId: number | null;
                }[];
            }[] = [];

            for (const sheetData of excelData.sheets) {
                const worksheetData: any[][] = [];

                if (
                    sheetData.extraContent &&
                    sheetData.extraContent.length > 0
                ) {
                    worksheetData.push(...sheetData.extraContent);
                }

                const headerRow = sheetData.columnHeaders.map(
                    (header) => header.name
                );
                worksheetData.push(headerRow);

                const erpHeader = sheetData.columnHeaders.find((header) =>
                    ERP_ID_CANDIDATES.some((candidate) =>
                        header.name.toLowerCase().includes(candidate)
                    )
                );

                const studentsForSheet: {
                    erpId: string | null;
                    midsemDocFileId: number | null;
                    endsemDocFileId: number | null;
                }[] = [];

                for (const student of sheetData.studentData) {
                    const row = sheetData.columnHeaders.map((header) => {
                        const value = student[header.name];
                        return value !== undefined && value !== null
                            ? value
                            : "";
                    });
                    worksheetData.push(row);

                    const erpId = erpHeader
                        ? normalizeIdentifier(student[erpHeader.name])
                        : null;
                    const studentRecord = student as Record<string, unknown>;
                    const midsemDocFileId = parseNumericId(
                        studentRecord["_midsemDocFileId"] ??
                            studentRecord["midsemDocFileId"]
                    );
                    const endsemDocFileId = parseNumericId(
                        studentRecord["_endsemDocFileId"] ??
                            studentRecord["endsemDocFileId"]
                    );

                    studentsForSheet.push({
                        erpId,
                        midsemDocFileId,
                        endsemDocFileId,
                    });
                }

                const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);

                const colWidths = sheetData.columnHeaders.map((header) => {
                    if (header.type === "number") {
                        return { wch: 15 };
                    } else if (header.type === "grade") {
                        return { wch: 10 };
                    } else if (header.name.toLowerCase().includes("name")) {
                        return { wch: 25 };
                    } else {
                        return { wch: 15 };
                    }
                });
                worksheet["!cols"] = colWidths;

                const headerRowIndex = sheetData.extraContent
                    ? sheetData.extraContent.length
                    : 0;
                const headerRange = XLSX.utils.decode_range(
                    worksheet["!ref"] || "A1"
                );

                for (let col = headerRange.s.c; col <= headerRange.e.c; col++) {
                    const cellAddress = XLSX.utils.encode_cell({
                        r: headerRowIndex,
                        c: col,
                    });
                    if (!worksheet[cellAddress]) continue;

                    worksheet[cellAddress].s = {
                        font: { bold: true },
                        fill: { fgColor: { rgb: "F0F0F0" } },
                        alignment: { horizontal: "center" },
                    };
                }

                XLSX.utils.book_append_sheet(
                    workbook,
                    worksheet,
                    sheetData.sheetName
                );

                sheetMetadata.push({
                    sheetName: sheetData.sheetName,
                    students: studentsForSheet,
                });
            }

            const excelBuffer = XLSX.write(workbook, {
                type: "buffer",
                bookType: "xlsx",
                compression: true,
            });

            const baseFileName = excelData.fileName.replace(/\.[^/.]+$/, "");
            const excelFileName = sanitizePathSegment(
                `${baseFileName}_graded.xlsx`,
                "graded.xlsx"
            );
            const zipFileName = sanitizePathSegment(
                `${baseFileName}_graded.zip`,
                "graded.zip"
            );

            const allFileIds = new Set<number>();
            sheetMetadata.forEach((meta) => {
                meta.students.forEach((studentMeta) => {
                    if (studentMeta.midsemDocFileId !== null) {
                        allFileIds.add(studentMeta.midsemDocFileId);
                    }
                    if (studentMeta.endsemDocFileId !== null) {
                        allFileIds.add(studentMeta.endsemDocFileId);
                    }
                });
            });

            const fileRecords = allFileIds.size
                ? await db
                      .select({
                          id: filesTable.id,
                          originalName: filesTable.originalName,
                          filePath: filesTable.filePath,
                      })
                      .from(filesTable)
                      .where(inArray(filesTable.id, Array.from(allFileIds)))
                : [];

            const fileMap = new Map(
                fileRecords.map((record) => [record.id, record])
            );
            const fileBufferCache = new Map<number, Buffer>();

            const zip = new JSZip();
            zip.file(excelFileName, excelBuffer);

            let sheetIndex = 0;
            for (const meta of sheetMetadata) {
                const sanitizedSheetName = sanitizePathSegment(
                    meta.sheetName,
                    `course_${++sheetIndex}`
                );
                const courseFolder = zip.folder(sanitizedSheetName);
                if (!courseFolder) continue;

                const midsemFolder = courseFolder.folder("midsem");
                const endsemFolder = courseFolder.folder("endsem");

                let studentIndex = 0;
                for (const studentMeta of meta.students) {
                    studentIndex += 1;
                    const erpIdForFile = sanitizePathSegment(
                        studentMeta.erpId ?? `student_${studentIndex}`,
                        `student_${studentIndex}`
                    );

                    if (studentMeta.midsemDocFileId !== null && midsemFolder) {
                        const record = fileMap.get(studentMeta.midsemDocFileId);
                        if (record) {
                            if (!fileBufferCache.has(record.id)) {
                                try {
                                    const buffer = await fs.readFile(
                                        record.filePath
                                    );
                                    fileBufferCache.set(record.id, buffer);
                                } catch (readError) {
                                    console.error(
                                        "Failed to read midsem file",
                                        {
                                            fileId: record.id,
                                            filePath: record.filePath,
                                            error: readError,
                                        }
                                    );
                                }
                            }
                            const buffer = fileBufferCache.get(record.id);
                            if (buffer) {
                                const extension = getFileExtension(
                                    record.originalName,
                                    record.filePath
                                );
                                midsemFolder.file(
                                    `${erpIdForFile}${extension}`,
                                    buffer
                                );
                            }
                        }
                    }

                    if (studentMeta.endsemDocFileId !== null && endsemFolder) {
                        const record = fileMap.get(studentMeta.endsemDocFileId);
                        if (record) {
                            if (!fileBufferCache.has(record.id)) {
                                try {
                                    const buffer = await fs.readFile(
                                        record.filePath
                                    );
                                    fileBufferCache.set(record.id, buffer);
                                } catch (readError) {
                                    console.error(
                                        "Failed to read endsem file",
                                        {
                                            fileId: record.id,
                                            filePath: record.filePath,
                                            error: readError,
                                        }
                                    );
                                }
                            }
                            const buffer = fileBufferCache.get(record.id);
                            if (buffer) {
                                const extension = getFileExtension(
                                    record.originalName,
                                    record.filePath
                                );
                                endsemFolder.file(
                                    `${erpIdForFile}${extension}`,
                                    buffer
                                );
                            }
                        }
                    }
                }
            }

            const zipBuffer = await zip.generateAsync({
                type: "nodebuffer",
                compression: "DEFLATE",
                compressionOptions: { level: 9 },
            });

            res.setHeader("Content-Type", "application/zip");
            res.setHeader(
                "Content-Disposition",
                `attachment; filename="${zipFileName}"`
            );
            res.setHeader("Content-Length", zipBuffer.length);

            res.send(zipBuffer);
        } catch (error) {
            if (error instanceof z.ZodError) {
                return next(
                    new HttpError(HttpCode.BAD_REQUEST, "Invalid data format")
                );
            }
            return next(
                new HttpError(
                    HttpCode.INTERNAL_SERVER_ERROR,
                    "Error exporting Excel file"
                )
            );
        }
    })
);

export default router;
