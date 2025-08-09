import { checkAccess } from "@/middleware/auth.ts";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import { HttpCode, HttpError } from "@/config/errors.ts";
import db from "@/config/db/index.ts";
import { Router } from "express";
import { eq, getTableColumns, inArray } from "drizzle-orm";
import environment from "@/config/environment.ts";
import ExcelJS from "exceljs";
import { publicationsTable } from "@/config/db/schema/publications.ts";

const router = Router();
const camelCaseToTitleCase = (str: string): string => {
    return str
        .replace(/([A-Z])/g, " $1") // Insert a space before all caps
        .split(" ")
        .map(
            (word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
        )
        .join(" ")
        .trim();
};

router.post(
    "/",
    checkAccess(),
    asyncHandler(async (req, res, next) => {
        const {
            citIDs,
            columnsVisible,
        }: { citIDs: string[]; columnsVisible: string[] } = req.body;

        if (!citIDs?.length || !columnsVisible?.length) {
            res.status(400).json({
                error: "pubIDs and columnsVisible are required arrays.",
            });
            return;
        }


        const items = await db
            .select()
            .from(publicationsTable)
            .where(inArray(publicationsTable.citationId, citIDs))

        if (!items.length) {
            return next(
                new HttpError(
                    HttpCode.NOT_FOUND,
                    "No items found for given IDs."
                )
            );
        }

        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet("publications");

        // Convert header keys from camelCase to Capitalise Case
        const transformedHeaders = columnsVisible.map((header) =>
            camelCaseToTitleCase(header)
        );

        const headerRow = worksheet.addRow(transformedHeaders);
        headerRow.eachCell((cell) => {
            cell.font = { bold: true };
            cell.alignment = {
                wrapText: true,
                vertical: "middle",
                horizontal: "left",
            };
        });

        items.forEach((item) => {
            let rowData = columnsVisible.map((col) => {
                const cellValue = item[col as keyof typeof item];
                return cellValue;
            });
            let newRow = worksheet.addRow(rowData);

            newRow.eachCell((cell) => {
                cell.alignment = { wrapText: true };
            });
        })

        columnsVisible.forEach((col, index) => {
                const maxLength = Math.max(
                    col.length,
                    ...items.map((item) =>
                        item[col as keyof typeof item]
                            ? item[col as keyof typeof item]!.toString().length
                            : 10
                    )
                );
                worksheet.getColumn(index + 1).width = Math.min(
                    maxLength + 2,
                    30
                );
        });

        
        // Write workbook to a buffer
        const buffer = await workbook.xlsx.writeBuffer();

        // Set response headers for file download
        res.setHeader(
            "Content-Type",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        );
        res.setHeader(
            "Content-Disposition",
            `attachment; filename="${environment.DEPARTMENT_NAME}_Department_-_Export-Publications.xlsx"`
        );

        res.send(buffer);
    })
)

export default router;