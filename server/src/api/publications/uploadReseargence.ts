import { excelUpload } from "@/config/multer.ts";
import { checkAccess } from "@/middleware/auth.ts";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import { Router, Request, Response } from "express";
import { eq } from "drizzle-orm";
import db from "@/config/db/index.ts";
import XLSX from "xlsx";
import { researgencePublications } from "@/config/db/schema/publications.ts";
import { publicationsSchemas } from "lib";

const router = Router();

interface Publication {
  pubId: number;
  authors: string;
  homeAuthors: string | undefined;
  homeAuthorDepartment: string | undefined;
  homeAuthorInstitute: string | undefined;
  publicationTitle: string;
  scs: number | undefined;
  wos: number | undefined;
  sci: string | undefined;
  sourcePublication: string;
  level: string;
  articleType: string;
  year: number;
  month: (typeof publicationsSchemas.months)[number] | undefined;
  homeAuthorLocation: string;
  volNo: string;
  issNo: string;
  bPage: string;
  ePage: string;
  snip: string | undefined;
  sjr: string | undefined;
  impactFactor: string | undefined;
  citeScore: string | undefined;
  qRankScs: string | undefined;
  qRankWos: string | undefined;
  pIssn: string | undefined;
  eIssn: string | undefined;
  pIsbn: string | undefined;
  eIsbn: string | undefined;
  link: string | undefined;
}

function parseRow(row: any): Publication | null {
    if (!row || Object.keys(row).length === 0) {
        return null;
    }
    if (
        !row["PUB ID"] ||
        !row["AUTHORS"] ||
        !row["PUBLICATION TITLE"] ||
        !row["SOURCE PUBLICATION"] ||
        !row["YEAR"] ||
        !row["ARTICLE TYPE"]
    )
        return null;

    return {
        pubId: parseInt(row["PUB ID"].trim()),
        authors: row["AUTHORS"].trim(),
        homeAuthors: row["HOME AUTHORS"]?.trim() || undefined,
        homeAuthorDepartment: row["HOME AUTHOR DEPARTMENT"]?.trim() || undefined,
        homeAuthorInstitute: row["HOME AUTHOR INSTITUTE"]?.trim() || undefined,
        publicationTitle: row["PUBLICATION TITLE"].trim(),
        scs: parseInt(row["SCS"]?.trim()) || undefined,
        wos: parseInt(row["WOS"]?.trim()) || undefined,
        sci: row["SCI"]?.trim() || undefined,
        sourcePublication: row["SOURCE PUBLICATION"].trim(),
        level: row["LEVEL"]?.trim() || undefined,
        articleType: row["ARTICLE TYPE"].trim(),
        year: parseInt(row["YEAR"].trim()),
        month: row["MONTH"] ? (publicationsSchemas.months[parseInt(row["MONTH"])]) : undefined,
        homeAuthorLocation: row["HOME AUTHOR LOCATION"]?.trim() || undefined,
        volNo: row["VOL NO"]?.trim() || undefined,
        issNo: row["ISS NO"]?.trim() || undefined,
        bPage: row["B PAGE"]?.trim() || undefined,
        ePage: row["E PAGE"]?.trim() || undefined,
        snip: row["SNIP"]?.trim() || undefined,
        sjr: row["SJR"]?.trim() || undefined,
        impactFactor: row["IF"]?.trim() || undefined,
        citeScore: row["SNIP"]?.trim() || undefined,
        qRankScs: row["Q RANK(SCS)"]?.trim() || undefined,
        qRankWos: row["Q RANK(WOS)"]?.trim() || undefined,
        pIssn: row["P ISSN"]?.trim() || undefined,
        eIssn: row["E ISSN"]?.trim() || undefined,
        pIsbn: row["P ISBN"]?.trim() || undefined,
        eIsbn: row["E ISBN"]?.trim() || undefined,
        link: row["LINK"]?.trim() || undefined,
    };
}

router.post(
    "/",
    checkAccess("publications:upload"),
    excelUpload.single("file"),
    asyncHandler(async (req: Request, res: Response) => {

        if (!req.file) {
            res.status(400).json({ error: "No file uploaded" });
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
                let [existingProject] = await db
                    .select()
                    .from(researgencePublications)
                    .where(eq(researgencePublications.publicationTitle, parsedRow.publicationTitle));
                if (existingProject) {
                    results.failed++;
                    results.errors.push(
                        `Row ${i + 2}: Project for student ID ${parsedRow.publicationTitle} already exists`
                    );
                    continue;
                }

                let [newProject] = await db
                    .insert(researgencePublications)
                    .values(parsedRow)
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
            message: "Data upload completed",
            results,
        });
    })
);

export default router;
