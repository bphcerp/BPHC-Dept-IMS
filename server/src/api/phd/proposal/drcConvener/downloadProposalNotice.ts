import express from "express";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import { checkAccess } from "@/middleware/auth.ts";
import { HttpError, HttpCode } from "@/config/errors.ts";
import db from "@/config/db/index.ts";
import { phdProposals } from "@/config/db/schema/phd.ts";
import { inArray } from "drizzle-orm";
import environment from "@/config/environment.ts";
import { z } from "zod";
import fs from "fs/promises";
import path from "path";
import { exec } from "child_process";
import { promisify } from "util";

// Promisify the exec function for async/await usage
const execAsync = promisify(exec);

const downloadNoticeSchema = z.object({
    proposalIds: z.array(z.number().int().positive()).min(1),
});

// A function to run the LibreOffice command for DOCX to PDF conversion
const convertDocxToPdf = async (docxPath: string, outputDir: string) => {
    const command = `libreoffice --headless --convert-to pdf --outdir ${outputDir} ${docxPath}`;
    try {
        await execAsync(command);
        const pdfPath = path.join(
            outputDir,
            path.basename(docxPath, ".docx") + ".pdf"
        );
        return pdfPath;
    } catch (error) {
        console.error("Error during DOCX to PDF conversion:", error);
        throw new HttpError(
            HttpCode.INTERNAL_SERVER_ERROR,
            "Failed to convert document to PDF. Ensure LibreOffice is installed on the server."
        );
    }
};

const router = express.Router();

router.post(
    "/",
    checkAccess(),
    asyncHandler(async (req, res) => {
        const { proposalIds } = downloadNoticeSchema.parse(req.body);

        const proposalsForNotice = await db.query.phdProposals.findMany({
            where: inArray(phdProposals.id, proposalIds),
            with: {
                student: true,
                supervisor: true,
                dacMembers: {
                    with: {
                        dacMember: true,
                    },
                },
            },
        });

        if (!proposalsForNotice || proposalsForNotice.length === 0) {
            throw new HttpError(
                HttpCode.NOT_FOUND,
                "No valid proposals found for the given IDs."
            );
        }

        if (
            proposalsForNotice.some(
                (p) =>
                    !["finalising", "formalising", "completed"].includes(
                        p.status
                    )
            )
        ) {
            throw new HttpError(
                HttpCode.BAD_REQUEST,
                "One or more selected proposals are not ready for a notice. Please select proposals with status 'Finalising' or 'Formalising'."
            );
        }

        const drcUser = await db.query.faculty.findFirst({
            where: (cols, { eq }) => eq(cols.email, req.user!.email),
            columns: { name: true },
        });
        const drcConvenerName = drcUser?.name || req.user!.email;

        // --- DOCX Templating Logic ---
        // Use createRequire to reliably load CJS modules in an ESM project
        const { createRequire } = await import("node:module");
        const require = createRequire(import.meta.url);
        const Docxtemplater = require("docxtemplater");
        const PizZip = require("pizzip");

        // Correctly resolve the path relative to the current file
        const templatePath = path.join(import.meta.dirname, "./notice.docx");
        const tempDir = path.resolve("./temp"); // A temporary directory to store files

        let generatedPdfPath = "";
        let tempDocxPath = "";

        try {
            // 1. Prepare data for the template
            const templateData = {
                department_name:
                    environment.DEPARTMENT_NAME || "___________________",
                proposals: proposalsForNotice.map((p) => ({
                    student_info: `${p.student.name || ""}\n${
                        p.student.idNumber || ""
                    }`,
                    topic: p.title,
                    supervisor: p.supervisor.name || p.supervisor.email,
                    dac_members: p.dacMembers
                        .map((m) => m.dacMember.name)
                        .join(", "),
                    datetime: p.seminarDate
                        ? `${new Date(p.seminarDate).toLocaleDateString()} at ${
                              p.seminarTime || ""
                          }`
                        : "TBD",
                    venue: p.seminarVenue || "TBD",
                })),
                drc_convener_name: drcConvenerName,
            };

            // 2. Load the template and render the document
            const content = await fs.readFile(templatePath);
            const zip = new PizZip(content);
            const doc = new Docxtemplater(zip, {
                paragraphLoop: true,
                linebreaks: true,
            });

            doc.render(templateData);

            const buf = doc.getZip().generate({ type: "nodebuffer" });

            // 3. Save the generated DOCX temporarily
            await fs.mkdir(tempDir, { recursive: true });
            tempDocxPath = path.join(tempDir, `notice_${Date.now()}.docx`);
            await fs.writeFile(tempDocxPath, buf);

            // 4. Convert the generated DOCX to PDF using LibreOffice
            generatedPdfPath = await convertDocxToPdf(tempDocxPath, tempDir);

            const pdfBuffer = await fs.readFile(generatedPdfPath);

            // 5. Send the final PDF to the user
            res.setHeader("Content-Type", "application/pdf");
            res.setHeader(
                "Content-Disposition",
                `attachment; filename="Seminar_Notice.pdf"`
            );
            res.end(pdfBuffer);
        } finally {
            // 6. Clean up temporary files
            if (tempDocxPath)
                await fs.unlink(tempDocxPath).catch(console.error);
            if (generatedPdfPath)
                await fs.unlink(generatedPdfPath).catch(console.error);
        }
    })
);

export default router;
