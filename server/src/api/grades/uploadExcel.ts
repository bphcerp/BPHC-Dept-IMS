import { Router } from "express";
import { checkAccess } from "@/middleware/auth.ts";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import { excelUpload } from "@/config/multer.ts";
import { HttpCode, HttpError } from "@/config/errors.ts";
import * as XLSX from "xlsx";

const router = Router();

interface ColumnHeader {
    name: string;
    type: 'text' | 'number' | 'grade' | 'select' | 'serial';
    options?: string[];
}

interface StudentData {
    [key: string]: any;
}

interface SheetData {
    sheetName: string;
    headerRows: number;
    columnHeaders: ColumnHeader[];
    studentData: StudentData[];
    extraContent?: any[][];
}

interface ExcelData {
    fileName: string;
    sheets: SheetData[];
}

function detectTableStructure(sheet: XLSX.WorkSheet, sheetName?: string): {
    headerRow: number;
    dataStartRow: number;
    columnHeaders: ColumnHeader[];
    gradeOptions: string[];
} {
    const jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: null });
    const gradeOptions = new Set<string>();

    for (let i = 0; i < Math.min(50, jsonData.length); i++) {
        const row = jsonData[i] as any[];
        if (!row) continue;

        const headerKeywords = [
            'name', 'id', 'serial', 's.no', 'roll', 'marks', 'grade', 'student',
            'mid', 'end', 'sem', 'total', 'emplid', 'erp', 'campus', 'reg', 'registration', 'email'
        ];
        const matchingCells = row.filter(cell =>
            cell &&
            typeof cell === 'string' &&
            headerKeywords.some(keyword => cell.toLowerCase().includes(keyword))
        );

        const hasGenericColumns = row.some(cell => {
            if (!cell || typeof cell !== 'string') return false;
            const cellStr = cell.toString().toLowerCase().trim();
            return cellStr.startsWith('column') ||
                cellStr.match(/^col\d+$/) ||
                cellStr.match(/^field\d+$/) ||
                cellStr === '' ||
                cellStr.match(/^\d+$/);
        });

        const hasHeaders = matchingCells.length >= 2 && !hasGenericColumns;

        if (hasHeaders) {
            let columnHeaders: ColumnHeader[] = row.map((cell, index) => {
                let headerName = cell?.toString().trim();
                const lower = headerName?.toLowerCase() || '';

                const isGeneric = !headerName ||
                    headerName === '' ||
                    lower.startsWith('column') ||
                    /^(col|field)\d+$/.test(lower) ||
                    /^\d+$/.test(headerName);
                if (isGeneric) {
                    headerName = `Column_${index + 1}`;
                }

                let type: ColumnHeader['type'] = 'text';
                if (lower.includes('grade') || lower.includes('letter') || lower.includes('result')) {
                    type = 'grade';
                } else if (lower.includes('s.no') || lower.includes('serial')) {
                    type = 'serial';
                } else if (
                    lower.includes('marks') || lower.includes('score') || lower.includes('number') ||
                    lower.includes('mid') || lower.includes('end') || lower.includes('total') || lower.includes('point')
                ) {
                    type = 'number';
                }

                return { name: headerName, type };
            });

            const seen: Record<string, number> = {};
            columnHeaders = columnHeaders.map((h) => {
                const base = h.name;
                if (seen[base] === undefined) {
                    seen[base] = 1;
                    return h;
                }
                seen[base] += 1;
                return { ...h, name: `${base} (${seen[base]})` };
            });

            for (let j = i + 1; j < Math.min(i + 300, jsonData.length); j++) {
                const dataRow = jsonData[j] as any[];
                if (!dataRow) continue;

                if (dataRow.every(cell => !cell || cell.toString().trim() === '')) continue;

                columnHeaders.forEach((header, headerIndex) => {
                    if (header.type === 'grade') {
                        const cell = dataRow[headerIndex];

                        if (cell) {
                            const gradeValue = cell.toString().trim();

                            if (gradeValue &&
                                gradeValue.length <= 10 &&
                                !gradeValue.toLowerCase().includes('grade') &&
                                !gradeValue.toLowerCase().includes('marks') &&
                                !gradeValue.toLowerCase().includes('name') &&
                                !gradeValue.toLowerCase().includes('serial') &&
                                !gradeValue.toLowerCase().includes('id') &&
                                !gradeValue.toLowerCase().includes('s.no') &&
                                !gradeValue.toLowerCase().includes('emplid') &&
                                !gradeValue.toLowerCase().includes('campus')) {
                                gradeOptions.add(gradeValue);
                            }
                        }
                    }
                });
            }

            logger.debug(sheetName);

            return {
                headerRow: i,
                dataStartRow: i + 1,
                columnHeaders,
                gradeOptions: Array.from(gradeOptions).sort()
            };
        }
    }

    const firstRow = jsonData[0] as any[];
    let fallbackHeaders: ColumnHeader[] = [];

    if (firstRow && firstRow.length > 0) {
        firstRow.forEach((cell, index) => {
            let headerName = cell?.toString().trim();

            const lower = headerName?.toLowerCase() || '';
            const isGeneric = !headerName || headerName === '' || lower.startsWith('column') || /^(col|field)\d+$/.test(lower) || /^\d+$/.test(headerName);
            if (isGeneric) headerName = `Column_${index + 1}`;

            let type: ColumnHeader['type'] = 'text';
            if (headerName.toLowerCase().includes('grade') ||
                headerName.toLowerCase().includes('letter') ||
                headerName.toLowerCase().includes('result')) {
                type = 'grade';
            } else if (headerName.toLowerCase().includes('s.no') ||
                headerName.toLowerCase().includes('serial')) {
                type = 'serial';
            } else if (headerName.toLowerCase().includes('marks') ||
                headerName.toLowerCase().includes('score') ||
                headerName.toLowerCase().includes('number') ||
                headerName.toLowerCase().includes('mid') ||
                headerName.toLowerCase().includes('end') ||
                headerName.toLowerCase().includes('total') ||
                headerName.toLowerCase().includes('point')) {
                type = 'number';
            }

            fallbackHeaders.push({ name: headerName, type });
        });
    }

    const seen: Record<string, number> = {};
    fallbackHeaders = fallbackHeaders.map((h) => {
        const base = h.name;
        if (seen[base] === undefined) {
            seen[base] = 1;
            return h;
        }
        seen[base] += 1;
        return { ...h, name: `${base} (${seen[base]})` };
    });

    if (fallbackHeaders.length === 0) {
        fallbackHeaders.push(
            { name: 'S.No', type: 'serial' },
            { name: 'Name', type: 'text' },
            { name: 'Marks', type: 'number' },
            { name: 'Grade', type: 'grade' }
        );
    }

    return {
        headerRow: 0,
        dataStartRow: 1,
        columnHeaders: fallbackHeaders,
        gradeOptions: Array.from(gradeOptions).sort()
    };
}

function parseStudentData(
    sheet: XLSX.WorkSheet,
    _headerRow: number,
    dataStartRow: number,
    columnHeaders: ColumnHeader[]
): StudentData[] {
    const jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: null });
    const students: StudentData[] = [];


    for (let i = dataStartRow; i < jsonData.length; i++) {
        const row = jsonData[i] as any[];
        if (!row || row.length === 0) continue;

        const isEmpty = row.every(cell => cell === null || cell === undefined || (typeof cell === 'string' && cell.toString().trim() === ''));
        if (isEmpty) continue;

        const student: StudentData = {};

        columnHeaders.forEach((header, headerIndex) => {
            const cellValue = row[headerIndex];

            if (header.type === 'number') {
                const numValue = cellValue ? parseFloat(cellValue) : undefined;
                student[header.name] = numValue;
            } else if (header.type === 'grade') {
                const gradeValue = cellValue?.toString().trim() || undefined;
                student[header.name] = gradeValue;
            } else {
                const textValue = cellValue?.toString().trim() || undefined;
                student[header.name] = textValue;
            }
        });

        const hasAnyData = Object.values(student).some(value =>
            value !== undefined && value !== null && value !== ''
        );

        const headerHints = ['s.no', 'serial', 'id', 'name', 'marks', 'grade', 'emplid', 'campus'];
        const headerishCount = Object.values(student).reduce((acc, v) => {
            if (typeof v === 'string') {
                const l = v.toLowerCase();
                if (headerHints.some(h => l.includes(h))) return acc + 1;
            }
            return acc;
        }, 0);
        const looksLikeHeader = headerishCount > Math.max(2, Math.floor(Object.keys(student).length * 0.6));

        if (hasAnyData && !looksLikeHeader) {
            students.push(student);
        }
    }
    return students;
}

router.post(
    "/",
    checkAccess("grades:upload"),
    excelUpload.single("excel"),
    asyncHandler(async (req, res, next) => {
        if (!req.file) {
            return next(new HttpError(HttpCode.BAD_REQUEST, "No file uploaded"));
        }

        try {
            const workbook = XLSX.read(req.file.buffer, { type: "buffer", cellDates: true });
            const excelData: ExcelData = {
                fileName: req.file.originalname,
                sheets: []
            };

            const allGradeOptions = new Set<string>();

            for (const sheetName of workbook.SheetNames) {
                const sheet = workbook.Sheets[sheetName];
                if (!sheet) continue;

                const { headerRow, dataStartRow, columnHeaders, gradeOptions } = detectTableStructure(sheet, sheetName);
                const studentData = parseStudentData(sheet, headerRow, dataStartRow, columnHeaders);

                gradeOptions.forEach(grade => allGradeOptions.add(grade));

                const jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: null });
                const extraContent = jsonData.slice(0, headerRow) as any[][];

                const sheetData: SheetData = {
                    sheetName,
                    headerRows: headerRow,
                    columnHeaders,
                    studentData,
                    extraContent: extraContent.length > 0 ? extraContent : undefined
                };

                excelData.sheets.push(sheetData);
            }

            if (excelData.sheets.length === 0) {
                return next(new HttpError(HttpCode.BAD_REQUEST, "No valid sheets found in the Excel file"));
            }

            res.json({
                success: true,
                data: excelData,
                gradeOptions: Array.from(allGradeOptions).sort()
            });

        } catch (error) {
            return next(new HttpError(HttpCode.INTERNAL_SERVER_ERROR, "Error processing Excel file"));
        }
    })
);

export default router;
