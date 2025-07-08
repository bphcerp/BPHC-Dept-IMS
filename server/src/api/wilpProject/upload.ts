import { excelUpload } from "@/config/multer.ts";
import { checkAccess } from "@/middleware/auth.ts";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import { Router } from "express";
import { eq } from "drizzle-orm";
import db from "@/config/db/index.ts";
import XLSX from "xlsx";
import {
    degreeProgramEnum,
    wilpProject,
} from "@/config/db/schema/wilpProject.ts";

const router = Router();

interface WilpProjectRow {
    studentId: string;
    discipline: string;
    studentName: string;
    organization: string;
    degreeProgram: string;
    researchArea: string;
    dissertationTitle: string;
    reminder?: Date;
    deadline?: Date;
}

function parseRow(row: any): WilpProjectRow | null {
    if (!row || Object.keys(row).length === 0) {
        return null;
    }

    if (
        !row["student ID Number"] ||
        !row["discipline"] ||
        !row["student name"] ||
        !row["Employing Organization"] ||
        !row["Research Area"] ||
        !row["Dissertation Title"] ||
        !row["Degree Program"]
    )
        return null;

    let degreeProgram: string = row["Degree Program"];
    if (!degreeProgramEnum.enumValues.includes(degreeProgram as any)) {
        return null;
    }

    return {
        studentId: row["student ID Number"].toString().trim(),
        discipline: row["discipline"].toString().trim(),
        studentName: row["student name"].toString().trim(),
        organization: row["Employing Organization"].toString().trim(),
        degreeProgram: degreeProgram,
        researchArea: row["Research Area"].toString().trim(),
        dissertationTitle: row["Dissertation Title"].toString().trim(),
    };
}

router.post(
    "/",
    checkAccess("wilp:project:upload"),
    excelUpload.single("file"),
    asyncHandler(async (req, res) => {
        if (!req.file) {
            res.status(400).json({ error: "No file uploaded" });
            return;
        }
        if (!req.body.reminder) {
            res.status(400).json({ error: "No reminder set for projects" });
            return;
        }
        if (!req.body.deadline) {
            res.status(400).json({ error: "No deadline set for projects" });
            return;
        }

        const workbook = XLSX.read(req.file.buffer, { type: "buffer" });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const data = XLSX.utils.sheet_to_json(worksheet, {
            raw: false,
            dateNF: "dd-mm-yyyy",
        });

        if (data.length === 0) {
            res.status(400).json({ error: "No data found in the file" });
            return;
        }

        const results = {
            total: data.length,
            successful: 0,
            failed: 0,
            errors: [] as string[],
        };

        for (let i = 0; i < data.length; i++) {
            const row = data[i] as any;
            const parsedRow = parseRow(row);
            if (!parsedRow) {
                results.failed++;
                results.errors.push(
                    `Row ${i + 2}: Invalid or missing required data`
                );
                continue;
            }
            try {
                // Check if a project already exists for the student ID
                let [existingProject] = await db
                    .select()
                    .from(wilpProject)
                    .where(eq(wilpProject.studentId, parsedRow.studentId));
                if (existingProject) {
                    results.failed++;
                    results.errors.push(
                        `Row ${i + 2}: Project for student ID ${parsedRow.studentId} already exists`
                    );
                    continue;
                }

                let [newProject] = await db
                    .insert(wilpProject)
                    .values({
                        ...parsedRow,
                        degreeProgram:
                            parsedRow.degreeProgram as (typeof degreeProgramEnum.enumValues)[number],
                        reminder: new Date(req.body.reminder),
                        deadline: new Date(req.body.deadline),
                    })
                    .returning();
                if (newProject) results.successful++;
            } catch (error) {
                results.failed++;
                results.errors.push(
                    `Row ${i + 2}: ${error instanceof Error ? error.message : "Unknown error"}`
                );
            }
        }

        res.json({
            message: "Bulk upload completed",
            results,
        });
    })
);

export default router;
