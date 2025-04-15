import db from "@/config/db/index.ts";
import { inventoryCategories, inventoryItems, laboratories, vendors } from "@/config/db/schema/inventory.ts";
import { HttpCode, HttpError } from "@/config/errors.ts";
import { checkAccess } from "@/middleware/auth.ts";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import { eq } from "drizzle-orm";
import { Router } from "express";
import multer from "multer";
import { inventoryItemSchema, multipleEntrySchema } from "node_modules/lib/src/schemas/Inventory.ts";
import { InventoryItem, Laboratory } from "node_modules/lib/src/types/inventory.ts";
import * as XLSX from 'xlsx'
import { getLastItemNumber } from "../labs/getLastItemNumber.ts";
import parser from "any-date-parser";
import { PgTransaction } from "drizzle-orm/pg-core";

const router = Router()

type SheetInfo = {
    sheetName: string;
    columnOffset: number;
    dataOffset: number;
    columnIndexMap: Record<string, number>;
};

const getIsValidLabSheet = (buffer: Buffer<ArrayBufferLike>): SheetInfo & { workbook: XLSX.WorkBook } | null => {
    const workbook = XLSX.read(buffer, { type: 'buffer', cellDates: true });

    // Ensure there's only one sheet
    if (workbook.SheetNames.length !== 1) return null;

    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];

    // Convert sheet to an array of arrays
    const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });

    // Find the header row containing "Sl. No." (case-insensitive & trimmed)
    const headerRowIndex = data.findIndex((row) =>
        (row as any[]).some((cell) => typeof cell === "string" && cell.trim().toLowerCase() === "sl. no.")
    );
    if (headerRowIndex === -1) return null; // No valid headers found

    const headerRow = (data[headerRowIndex] as string[]).map((header) =>
        typeof header === "string" ? header.trim().toLowerCase() : ""
    );

    // Create a mapping of column headers to indices
    const columnIndexMap: Record<string, number> = {};
    headerRow.forEach((header, index) => {
        if (header) columnIndexMap[header] = index;
    });

    // Get the column index for "sl. no."
    const columnOffset = columnIndexMap["sl. no."];
    if (columnOffset === undefined) return null;

    // Find the dataOffset (first row where "Sl. No." is 1)
    const dataOffset = data.findIndex((row) => (row as any[])[columnOffset] === 1);
    if (dataOffset === -1) return null;

    return {
        sheetName,
        columnOffset,
        dataOffset,
        columnIndexMap,
        workbook
    };
};

// Some dates have dots in them
const parseDate = (date: any | Date) => {
    if (!date) return null

    if (date instanceof Date) return date
    if (!isNaN(new Date(date.toString()).getTime())) return new Date(date.toString())

    // For those edge cases where there are dots or slashes instead of dashes
    const parsedDate = parser.fromAny(date.toString())
    return parsedDate.invalid ? null : parsedDate
}

// Sanitize NA-like values to null
const sanitizeFlatArray = (arr: any[]) => {
    return arr.map(item => {
      if (
        typeof item === 'string' &&
        item.trim().toLowerCase().replace(/[\.\-_\s]/g, '') === 'na'
      ) {
        return null;
      }
      return item;
    });
  }
  

async function mapToInventoryItemAndSave(data: any[], selectedLab: Laboratory, columnIndexMap: Record<string, number>, tx: PgTransaction<any,any,any>): Promise<any> {

    const vendor = await db.query.vendors.findFirst({
        where: eq(vendors.vendorId, data[columnIndexMap['vendor id']])
    })
    const itemCategory = await db.query.inventoryCategories.findFirst({
        where: eq(inventoryCategories.code, data[columnIndexMap['category code']])
    })

    if (!itemCategory) throw Error(`Item category with code ${data[columnIndexMap['category code']]} invalid`)
    if (!vendor && data[columnIndexMap['vendor id']] !== null) throw Error(`Vendor with vendor id ${data[columnIndexMap['vendor id']]} invalid`)

    const lastItemNumber = await getLastItemNumber(selectedLab.id, tx)

    data = sanitizeFlatArray(data)

    const baseItem: Partial<InventoryItem> = {
        itemCategoryId: itemCategory.id,
        serialNumber: lastItemNumber,
        itemName: data[columnIndexMap["item name"]],
        specifications: data[columnIndexMap["specification(s)"]],
        quantity: Number(data[columnIndexMap["quantity"]]),
        noOfLicenses: Number(data[columnIndexMap["no of licenses"]]) ? Number(data[columnIndexMap["no of licenses"]]) : null,
        natureOfLicense: data[columnIndexMap["nature of license"]] ?? null,
        yearOfLease: Number(data[columnIndexMap["year of lease"]]) ? Number(data[columnIndexMap["year of lease"]]) : null,
        poAmount: !isNaN(Number(data[columnIndexMap["item amount in po (inr)"]]))
            ? typeof data[columnIndexMap["item amount in po (inr)"]] === "string"
                ? parseFloat(data[columnIndexMap["item amount in po (inr)"]].replace(/,/g, ""))
                : data[columnIndexMap["item amount in po (inr)"]] ?? 0
            : 0, // Convert to number, removing commas
        poNumber: data[columnIndexMap["po number"]]?.toString() ?? null,
        poDate: parseDate(data[columnIndexMap["po date"]]),
        labId: selectedLab.id,
        // labInchargeAtPurchase: data[columnIndexMap["lab incharge at the time of purchase"]],
        // labTechnicianAtPurchase: data[columnIndexMap["lab technician at the time of purchase"]],
        labInchargeAtPurchase: selectedLab.facultyInCharge.name,
        labTechnicianAtPurchase: selectedLab.technicianInCharge.name,
        fundingSource: data[columnIndexMap["funding source"]],
        dateOfInstallation: parseDate(data[columnIndexMap["date of installation"]]),
        vendorId: vendor?.id ?? null,
        warrantyFrom: parseDate(data[columnIndexMap["warranty details"]]) ?? null,
        warrantyTo: parseDate(data[columnIndexMap["warranty details"] + 1]) ?? null, // Assuming "to" is the next column (Warranty Details is a merged column)
        amcFrom: parseDate(data[columnIndexMap["amc details"]]) ?? null,
        amcTo: parseDate(data[columnIndexMap["amc details"] + 1]) ?? null, // Assuming "to" is the next column (AMC Details is a merged column)
        currentLocation: data[columnIndexMap["current location of the item"]] ?? null,
        softcopyOfPO: data[columnIndexMap["softcopy of po"]] ?? null,
        softcopyOfInvoice: data[columnIndexMap["softcopy of invoice"]] ??  null,
        softcopyOfNFA: data[columnIndexMap["softcopy of nfa"]] ??  null,
        softcopyOfAMC: data[columnIndexMap["softcopy of amc"]] ??  null,
        status: data[columnIndexMap["status"]] === "working" ? "Working" : null,
        equipmentPhoto: data[columnIndexMap["equipment photo (for cost above 10 lakhs)"]] ?? null,
        remarks: data[columnIndexMap["remarks"]] || null,
    };

    if (baseItem.quantity === 1) {
        baseItem.equipmentID = `BITS/EEE/${selectedLab.code}/${itemCategory.code}/${lastItemNumber.toString().padStart(4, '0')}`
        const parsedItem = inventoryItemSchema.omit({ id: true, transferId: true }).parse(baseItem)
        await tx.insert(inventoryItems).values(parsedItem)
    }
    else {
        const baseEquipmentID = `BITS/EEE/${selectedLab.code}/${itemCategory.code}/${lastItemNumber.toString().padStart(4, '0')}`;
        const items = Array.from({ length: baseItem.quantity! }, (_, i) => ({
            ...baseItem,
            equipmentID: `${baseEquipmentID}-${(i + 1).toString().padStart(2, '0')}`,
        }));
        const parsedItems = multipleEntrySchema.parse(items)
        await tx.insert(inventoryItems).values(parsedItems)
    }
}

const getAndSaveDataFromSheet = async (workbook: XLSX.WorkBook, sheetInfo: SheetInfo, selectedLabId: string) => {
    // Read workbook with dates preserved

    const { sheetName, columnOffset, dataOffset } = sheetInfo;
    const sheet = workbook.Sheets[sheetName];
    if (!sheet) throw Error(`Sheet ${sheetName} not found.`)

    // Get sheet data as an array of arrays
    const jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: null });

    // Process filtered data:
    // - Slice rows starting at dataOffset (where the actual data begins)
    // - Filter out all of the rows for which Item Name is not set (they're empty rows. Item Name is mandatory)
    // - For each row, slice columns starting at columnOffset
    // - For each cell, if a hyperlink exists (in sheet[cellRef].l.Target),
    //   replace the cell value with the hyperlink URL.
    const filteredData = jsonData.slice(dataOffset).filter((row) => (row as any[])[columnOffset + 2] !== null).map((row, rowIndex) =>
        (row as any[]).slice(columnOffset).map((cell, colIndex) => {
            // Compute Excel cell reference from dataOffset and columnOffset
            const cellRef = XLSX.utils.encode_cell({ r: dataOffset + rowIndex, c: columnOffset + colIndex });
            if (sheet[cellRef] && sheet[cellRef].l && sheet[cellRef].l.Target) {
                return sheet[cellRef].l.Target;
            }
            return cell;
        })
    );

    // Parse and Save Data

    const selectedLab = await db.query.laboratories.findFirst({
        with: {
            technicianInCharge: true,
            facultyInCharge: true,
        },
        where: eq(laboratories.id, selectedLabId)
    })

    await db.transaction(async (tx) => {
        for (const item of filteredData) {
            if (!item[sheetInfo.columnIndexMap['item name']]) continue; // Skip empty rows
            await mapToInventoryItemAndSave(item, selectedLab!, sheetInfo.columnIndexMap, tx);
        }
    })
};

const storage = multer.memoryStorage();
const upload = multer({ storage });

router.post('/', checkAccess(), upload.single('excel'), asyncHandler(async (req, res, next) => {
    try {

        const { labId } = req.body

        const sheetInfo = getIsValidLabSheet(req.file!.buffer)

        if (!sheetInfo) {
            return next(
                new HttpError(HttpCode.BAD_REQUEST, "Uploaded sheet not valid for bulk entry. Please check again.")
            )
        }

        await getAndSaveDataFromSheet(sheetInfo.workbook, sheetInfo, labId)

        res.status(201).json({ success: true });
    } catch (error) {
        res.status(500).json({ message: (error as Error).message ?? 'Error adding items in bulk', error });
        console.error('Error adding items in bulk', error);
    }
}));

export default router