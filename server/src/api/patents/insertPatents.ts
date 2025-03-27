import { db } from "@/config/db/index.ts"; // Import the Drizzle database instance
import { users, excelPatents } from "@/config/db/schema/patents.ts"; // Import table schemas
import express from "express";
import xlsx from "xlsx";
import multer from "multer";
import { patentsSchemas } from "@/validations/patentsSchemas.ts";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import { HttpCode, HttpError } from "@/config/errors.ts";

const router = express.Router();
const upload = multer(); // Setup multer for file handling

// Route: Insert patents from Excel file
router.post(
    "/insert-patents",
    upload.single("file"),
    asyncHandler(async (req, res, next) => {
        if (!req.file) {
            return next(new HttpError(HttpCode.BAD_REQUEST, "No file uploaded"));
        }

        // Validate file presence using Zod
        const parsedFile = patentsSchemas.insertPatentsBodySchema.safeParse({ file: req.file.buffer });
        if (!parsedFile.success) {
            return next(new HttpError(HttpCode.BAD_REQUEST, "Invalid file format"));
        }

        // Read and process Excel file
        const workbook = xlsx.read(req.file.buffer, { type: "buffer" });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const data = xlsx.utils.sheet_to_json(sheet);

        if (!data.length) {
            return next(new HttpError(HttpCode.BAD_REQUEST, "Uploaded file is empty"));
        }

        // Extract and process inventor names
        let inventorNames = new Set<string>();
        data.forEach((row: any) => {
            if (row["__EMPTY_1"]) {
                row["__EMPTY_1"].split(",").forEach((name: string) => {
                    inventorNames.add(name.trim());
                });
            }
        });

        // Fetch inventor emails
        const fetchedUsers = await db
            .select({ name: users.name, email: users.email })
            .from(users)
            .where(users.name.in(Array.from(inventorNames)));

        const emailMap = Object.fromEntries(fetchedUsers.map((user) => [user.name, user.email]));

        // Validate each row with Zod schema
        const validatedData = data.map((row: any) => {
            const patent = {
                applicationNumber: row["__EMPTY"],
                inventorsName: row["__EMPTY_1"] || "N/A",
                department: row["__EMPTY_2"] || "N/A",
                title: row["__EMPTY_3"] || "N/A",
                campus: row["__EMPTY_4"] || "N/A",
                filingDate: row["__EMPTY_5"] || "N/A",
                applicationPublicationDate: row["__EMPTY_6"] || "N/A",
                grantedDate: row["__EMPTY_7"] || "N/A",
                filingFy: row["__EMPTY_8"] || "N/A",
                filingAy: row["__EMPTY_9"] || "N/A",
                publishedAy: row["__EMPTY_10"] || "N/A",
                publishedFy: row["__EMPTY_11"] || "N/A",
                grantedFy: row["__EMPTY_12"] || "N/A",
                grantedAy: row["__EMPTY_13"] || "N/A",
                grantedCy: row["__EMPTY_14"] || "N/A",
                status: row["__EMPTY_15"] || "N/A",
            };

            // Validate against Zod schema
            const validation = patentsSchemas.excelPatentSchema.safeParse(patent);
            if (!validation.success) {
                console.error("Validation error:", validation.error.errors);
                throw new HttpError(HttpCode.BAD_REQUEST, "Invalid patent data in file");
            }

            return validation.data;
        });

        // Insert validated patents into the database
        await db.insert(excelPatents).values(validatedData);

        res.status(201).json({ message: "Patents inserted successfully" });
    })
);

export default router;
