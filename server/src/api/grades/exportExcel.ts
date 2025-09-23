import { Router } from "express";
import { checkAccess } from "@/middleware/auth.ts";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import { HttpCode, HttpError } from "@/config/errors.ts";
import * as XLSX from "xlsx";
import { z } from "zod";

const router = Router();

const exportExcelSchema = z.object({
    fileName: z.string(),
    sheets: z.array(z.object({
        sheetName: z.string(),
        headerRows: z.number(),
        columnHeaders: z.array(z.object({
            name: z.string(),
            type: z.enum(['text', 'number', 'grade', 'select', 'serial']),
            options: z.array(z.string()).optional(),
        })),
        studentData: z.array(z.record(z.any())),
        extraContent: z.array(z.array(z.any())).optional(),
    }))
});

router.post(
    "/",
    checkAccess("grades:export"),
    asyncHandler(async (req, res, next) => {
        try {
            const excelData = exportExcelSchema.parse(req.body);

            const workbook = XLSX.utils.book_new();

            for (const sheetData of excelData.sheets) {
                const worksheetData: any[][] = [];

                if (sheetData.extraContent && sheetData.extraContent.length > 0) {
                    worksheetData.push(...sheetData.extraContent);
                }

                const headerRow = sheetData.columnHeaders.map(header => header.name);
                worksheetData.push(headerRow);

                for (const student of sheetData.studentData) {
                    const row = sheetData.columnHeaders.map(header => {
                        const value = student[header.name];
                        return value !== undefined && value !== null ? value : "";
                    });
                    worksheetData.push(row);
                }

                const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);

                const colWidths = sheetData.columnHeaders.map(header => {
                    if (header.type === 'number') {
                        return { wch: 15 };
                    } else if (header.type === 'grade') {
                        return { wch: 10 };
                    } else if (header.name.toLowerCase().includes('name')) {
                        return { wch: 25 };
                    } else {
                        return { wch: 15 };
                    }
                });
                worksheet['!cols'] = colWidths;

                const headerRowIndex = sheetData.extraContent ? sheetData.extraContent.length : 0;
                const headerRange = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');

                for (let col = headerRange.s.c; col <= headerRange.e.c; col++) {
                    const cellAddress = XLSX.utils.encode_cell({ r: headerRowIndex, c: col });
                    if (!worksheet[cellAddress]) continue;

                    worksheet[cellAddress].s = {
                        font: { bold: true },
                        fill: { fgColor: { rgb: "F0F0F0" } },
                        alignment: { horizontal: "center" }
                    };
                }

                XLSX.utils.book_append_sheet(workbook, worksheet, sheetData.sheetName);
            }

            const excelBuffer = XLSX.write(workbook, {
                type: 'buffer',
                bookType: 'xlsx',
                compression: true
            });
            const fileName = excelData.fileName.replace(/\.[^/.]+$/, "_graded.xlsx");
            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
            res.setHeader('Content-Length', excelBuffer.length);

            res.send(excelBuffer);

        } catch (error) {
            console.error("Error exporting Excel file:", error);
            if (error instanceof z.ZodError) {
                return next(new HttpError(HttpCode.BAD_REQUEST, "Invalid data format"));
            }
            return next(new HttpError(HttpCode.INTERNAL_SERVER_ERROR, "Error exporting Excel file"));
        }
    })
);

export default router;
