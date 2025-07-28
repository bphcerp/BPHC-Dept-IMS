import { Request, Response } from "express";
import db from "@/config/db/index.ts";
import { checkAccess } from "@/middleware/auth.ts";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import express from "express";
import { wilpProject } from "@/config/db/schema/wilpProject.ts";
import XLSX from "xlsx";
import { faculty } from "@/config/db/schema/admin.ts";
import { eq } from "drizzle-orm";

const router = express.Router();

router.get(
    "/",
    checkAccess("wilp:project:download"),
    asyncHandler(async (_req: Request, res: Response) => {
        let data = await db
            .select({
                studentId: wilpProject.studentId,
                discipline: wilpProject.discipline,
                studentName: wilpProject.studentName,
                organization: wilpProject.organization,
                researchArea: wilpProject.researchArea,
                dissertationTitle: wilpProject.dissertationTitle,
                degreeProgram: wilpProject.degreeProgram,
                facultyEmail: wilpProject.facultyEmail,
                facultyName: faculty.name,
            })
            .from(wilpProject)
            .leftJoin(faculty, eq(wilpProject.facultyEmail, faculty.email))
            .orderBy(wilpProject.studentId);

        const workbook = XLSX.utils.book_new();
        const headers = [
            "student ID Number",
            "discipline",
            "student name",
            "Employing Organization",
            "Research Area",
            "Dissertation Title",
            "Degree Program",
            "Faculty Email",
            "Faculty Name",
        ];

        var worksheet;
        if (data.length > 0) {
            // Ensure the worksheet has the correct headers
            const sheetData = [
                headers,
                ...data.map((row) => [
                    row.studentId,
                    row.discipline,
                    row.studentName,
                    row.organization,
                    row.researchArea,
                    row.dissertationTitle,
                    row.degreeProgram,
                    row.facultyEmail,
                    row.facultyName,
                ]),
            ];
            worksheet = XLSX.utils.aoa_to_sheet(sheetData);
        } else {
            worksheet = XLSX.utils.aoa_to_sheet([headers]);
        }
        XLSX.utils.book_append_sheet(workbook, worksheet, "WILP Projects");

        const buffer = XLSX.write(workbook, {
            type: "buffer",
            bookType: "xlsx",
        });

        res.set({
            "Content-Disposition": "attachment; filename=wilp-projects.xlsx",
            "Content-Type":
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            "Content-Length": buffer.length,
        });
        res.send(buffer);
    })
);

export default router;
