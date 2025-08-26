import db from "@/config/db/index.ts";
import {
    inventoryCategories,
    inventoryItems,
    laboratories,
    vendors,
} from "@/config/db/schema/inventory.ts";
import { HttpCode, HttpError } from "@/config/errors.ts";
import { checkAccess } from "@/middleware/auth.ts";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import { eq, getTableColumns, inArray } from "drizzle-orm";
import { Router } from "express";
import ExcelJS from "exceljs";
import environment from "@/config/environment.ts";

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
            itemIds,
            columnsVisible,
        }: { itemIds: string[]; columnsVisible: string[] } = req.body;

        if (!itemIds?.length || !columnsVisible?.length) {
            res.status(400).json({
                error: "itemIds and columnsVisible are required arrays.",
            });
            return;
        }

        columnsVisible.splice(4, 0, "quantity");
        const allColumns = getTableColumns(inventoryItems);

        const columns = Object.fromEntries(
            Object.entries(allColumns).filter(([key, _value]) =>
                columnsVisible.includes(key)
            )
        ) as typeof allColumns;

        const items = await db
            .selectDistinctOn(
                [inventoryItems.serialNumber, inventoryItems.labId],
                {
                    ...columns,
                    serialNumber: inventoryItems.serialNumber,
                    lab: {
                        id: laboratories.id,
                        name: laboratories.name,
                        location: laboratories.location,
                        code: laboratories.code,
                    },
                    itemCategory: {
                        id: inventoryCategories.id,
                        name: inventoryCategories.name,
                        code: inventoryCategories.code,
                    },
                    vendor: {
                        id: vendors.id,
                        vendorId: vendors.vendorId,
                        name: vendors.name,
                        address: vendors.address,
                        pocName: vendors.pocName,
                        phoneNumber: vendors.phoneNumber,
                        email: vendors.email,
                    },
                }
            )
            .from(inventoryItems)
            .where(inArray(inventoryItems.id, itemIds))
            .leftJoin(laboratories, eq(laboratories.id, inventoryItems.labId))
            .leftJoin(
                inventoryCategories,
                eq(inventoryCategories.id, inventoryItems.itemCategoryId)
            )
            .leftJoin(vendors, eq(vendors.id, inventoryItems.vendorId));

        if (!items.length) {
            return next(
                new HttpError(
                    HttpCode.NOT_FOUND,
                    "No items found for given IDs."
                )
            );
        }

        const uniqueLabIds = [...new Set(items.map((item) => item.lab!.id))];
        const uniqueLabs = await db
            .select()
            .from(laboratories)
            .where(inArray(laboratories.id, uniqueLabIds));

        const workbook = new ExcelJS.Workbook();

        columnsVisible.splice(0, 0, "Sl.No.");

        if (columnsVisible.includes("vendor")) {
            // Remove vendor and all vendor's fields
            columnsVisible.splice(
                columnsVisible.indexOf("vendor"),
                1,
                "VendorId",
                "VendorName",
                "VendorPOCName",
                "VendorPhoneNumber",
                "VendorEmail"
            );
        }

        if (columnsVisible.includes("itemCategory")) {
            columnsVisible.splice(
                columnsVisible.indexOf("itemCategory"),
                0,
                "CategoryCode"
            );
        }

        // Convert header keys from camelCase to Capitalise Case
        const transformedHeaders = columnsVisible.map((header) =>
            camelCaseToTitleCase(header)
        );

        // Add data rows
        uniqueLabs.map((lab) => {
            const worksheet = workbook.addWorksheet(lab.name);
            // Add header row with styling
            const headerRow = worksheet.addRow(transformedHeaders);
            headerRow.eachCell((cell) => {
                cell.font = { bold: true };
                cell.alignment = {
                    wrapText: true,
                    vertical: "middle",
                    horizontal: "left",
                };
            });
            items
                .filter((item) => item.lab!.id === lab.id)
                .forEach((item, idx) => {
                    let rowData = columnsVisible.map((col) => {
                        const cellValue = item[col as keyof typeof item];
                        if (col === "Sl.No.")
                            return idx + 1; // Serial number
                        if (col === "lab")
                            return (cellValue as typeof item.lab)!.name;
                        else if (col === "itemCategory")
                            return (cellValue as typeof item.itemCategory)!
                                .name;
                        else if (col === "CategoryCode")
                            return item.itemCategory!.code;
                        else if (col === "VendorId")
                            return (
                                item.vendor?.vendorId ?? "Vendor Not Specified"
                            );
                        else if (col === "VendorName")
                            return item.vendor?.name ?? "Vendor Not Specified";
                        else if (col === "VendorPOCName")
                            return (
                                item.vendor?.pocName ?? "Vendor Not Specified"
                            );
                        else if (col === "VendorPhoneNumber")
                            return (
                                item.vendor?.phoneNumber ??
                                "Vendor Not Specified"
                            );
                        else if (col === "VendorEmail")
                            return item.vendor?.email ?? "Vendor Not Specified";
                        else if (col === "equipmentID" && item["quantity"] > 1)
                            return `${(cellValue as string).split("-")[0]}-01-${(item["quantity"] as number).toString().padStart(2, "0")}`;
                        else if (cellValue instanceof Date)
                            return cellValue.toLocaleString("en-IN", {
                                timeZone: "Asia/Kolkata",
                            });
                        return cellValue;
                    });
                    let newRow = worksheet.addRow(rowData);

                    newRow.eachCell((cell) => {
                        cell.alignment = { wrapText: true };
                    });
                });

            // Set column widths (optional)
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
            `attachment; filename="${environment.DEPARTMENT_NAME}_Department_-_Export_Inventory.xlsx"`
        );

        res.send(buffer);
    })
);

export default router;
