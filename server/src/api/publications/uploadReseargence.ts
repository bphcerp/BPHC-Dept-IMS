import { excelUpload } from "@/config/multer.ts";
import { checkAccess } from "@/middleware/auth.ts";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import { Router, Request, Response } from "express";
import { eq, sql } from "drizzle-orm";
import db from "@/config/db/index.ts";
import XLSX from "xlsx";
import { publicationsTable, researgencePublications } from "@/config/db/schema/publications.ts";
import { publicationsSchemas } from "lib";
import logger from "@/config/logger.ts";

const router = Router();

type ReseargencePublication = publicationsSchemas.ReseargencePublication;

function parseRow(row: any): ReseargencePublication | null {
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
        homeAuthors: row["HOME AUTHORS"]?.trim() || null,
        homeAuthorDepartment: row["HOME AUTHOR DEPARTMENT"]?.trim() || null,
        homeAuthorInstitute: row["HOME AUTHOR INSTITUTE"]?.trim() || null,
        publicationTitle: row["PUBLICATION TITLE"].trim(),
        scs: parseInt(row["SCS"]?.trim()) || null,
        wos: parseInt(row["WOS"]?.trim()) || null,
        sci: row["SCI"]?.trim() || null,
        sourcePublication: row["SOURCE PUBLICATION"].trim() || null,
        level: row["LEVEL"]?.trim() || null,
        type: row["ARTICLE TYPE"].trim() || null,
        year: parseInt(row["YEAR"].trim()),
        month: row["MONTH"] ? (publicationsSchemas.months[parseInt(row["MONTH"]) - 1]) : null,
        homeAuthorLocation: row["HOME AUTHOR LOCATION"]?.trim() || null,
        volNo: row["VOL NO"]?.trim() || null,
        issNo: row["ISS NO"]?.trim() || null,
        bPage: row["B PAGE"]?.trim() || null,
        ePage: row["E PAGE"]?.trim() || null,
        snip: row["SNIP"]?.trim() || null,
        sjr: row["SJR"]?.trim() || null,
        impactFactor: row["IF"]?.trim() || null,
        citeScore: row["CITE SCORE"]?.trim() || null,
        qRankScs: row["Q RANK(SCS)"]?.trim() || null,
        qRankWos: row["Q RANK(WOS)"]?.trim() || null,
        pIssn: row["P ISSN"]?.trim() || null,
        eIssn: row["E ISSN"]?.trim() || null,
        pIsbn: row["P ISBN"]?.trim() || null,
        eIsbn: row["E ISBN"]?.trim() || null,
        link: row["LINK"]?.trim() || null,
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
            matched: 0,
            successful: 0,
            failed: 0,
            repeated: 0,
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
                let [existingPub] = await db
                    .select()
                    .from(researgencePublications)
                    .where(eq( sql`lower(${researgencePublications.publicationTitle})`, sql`lower(${parsedRow.publicationTitle})`));

                if (existingPub) {
                    results.repeated++;
                    await db
                        .update(researgencePublications)
                        .set(parsedRow)
                        .where(eq( sql`lower(${researgencePublications.publicationTitle})`, sql`lower(${parsedRow.publicationTitle})`))
                }

                let [matchedPub] = await db
                    .select()
                    .from(publicationsTable)
                    .where(eq( sql`lower(${publicationsTable.title})`, sql`lower(${parsedRow.publicationTitle})`))

                if(matchedPub) {
                    results.matched++;

                    await db.update(publicationsTable)
                    .set({
                        type: parsedRow.type,
                        journal: parsedRow.sourcePublication,
                        volume: parsedRow.volNo,
                        issue: parsedRow.issNo,
                        month: parsedRow.month,
                        year: parsedRow.year.toString(),
                        link: parsedRow.link,
                        authorNames: parsedRow.authors,
                    }).where(eq(publicationsTable.citationId, matchedPub.citationId))
                }

                if(existingPub) continue;

                let [newEntry] = await db
                    .insert(researgencePublications)
                    .values(parsedRow)
                    .returning();
                if (newEntry) results.successful++;
                
            } catch (error) {
                results.failed++;
                results.errors.push(
                    `Row ${i + 2}: ${error instanceof Error ? error.message : "Unknown error"}`
                );
                logger.error(`Could not add publication : ${parsedRow.publicationTitle} due to an Unknown Error.`);
            }
        }

        logger.info(`Updated ${results.repeated} duplicate publications.`);
        logger.info("Data upload completed.");
        res.json({
            message: "Data upload completed",
            results,
        });
    })
);

export default router;
