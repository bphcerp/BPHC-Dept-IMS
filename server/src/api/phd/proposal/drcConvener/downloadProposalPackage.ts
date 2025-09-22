import express from "express";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import { checkAccess } from "@/middleware/auth.ts";
import { HttpError, HttpCode } from "@/config/errors.ts";
import db from "@/config/db/index.ts";
import JSZip from "jszip";
import fs from "fs/promises";
import { phdProposals } from "@/config/db/schema/phd.ts";
import { and, inArray } from "drizzle-orm";
import environment from "@/config/environment.ts";
import { phdSchemas } from "lib";
import path from "path";
import { exec } from "child_process";
import { promisify } from "util";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const Docxtemplater = require("docxtemplater");
const PizZip = require("pizzip");
const ImageModule = require("docxtemplater-image-module-free");
const execAsync = promisify(exec);

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

const CHECKED_XML = `<w:sym w:font="Wingdings" w:char="F0FE"/>`;
const UNCHECKED_XML = `<w:sym w:font="Wingdings" w:char="F0A8"/>`;

router.post(
    "/",
    checkAccess(),
    asyncHandler(async (req, res) => {
        const { proposalIds } = phdSchemas.downloadBulkPackageSchema.parse(
            req.body
        );
        const proposalsToPackage = await db.query.phdProposals.findMany({
            where: and(inArray(phdProposals.id, proposalIds)),
            with: {
                student: true,
                supervisor: true,
                dacReviews: {
                    with: {
                        dacMember: { with: { signatureFile: true } },
                        reviewForm: true,
                    },
                },
                appendixFile: true,
                summaryFile: true,
                outlineFile: true,
                placeOfResearchFile: true,
                outsideCoSupervisorFormatFile: true,
                outsideSupervisorBiodataFile: true,
            },
        });
        if (proposalsToPackage.length === 0) {
            throw new HttpError(
                HttpCode.NOT_FOUND,
                "No valid proposals found for the given IDs."
            );
        }
        const drcUser = await db.query.faculty.findFirst({
            where: (cols, { eq }) => eq(cols.email, req.user!.email),
            with: { signatureFile: true },
        });
        const zip = new JSZip();
        const tempDir = path.resolve("./temp");
        await fs.mkdir(tempDir, { recursive: true });

        const dacTemplatePath = path.join(import.meta.dirname, "./dac.docx");
        const dacTemplateContent = await fs.readFile(dacTemplatePath);
        const drcSignatureBuffer = drcUser?.signatureFile
            ? await fs
                  .readFile(drcUser.signatureFile.filePath)
                  .catch(() => null)
            : null;
        try {
            for (const proposal of proposalsToPackage) {
                const studentFolderName = `${
                    proposal.student.name || proposal.student.email
                }`.replace(/[\/\\?%*:|"<>]/g, "-");
                const studentFolder = zip.folder(studentFolderName);
                if (!studentFolder)
                    throw new Error("Could not create student folder in zip.");
                const filesToInclude = [
                    { name: "1_Appendix_I.pdf", file: proposal.appendixFile },
                    { name: "2_Summary.pdf", file: proposal.summaryFile },
                    { name: "3_Outline.pdf", file: proposal.outlineFile },
                    {
                        name: "4_Place_of_Research.pdf",
                        file: proposal.placeOfResearchFile,
                    },
                    {
                        name: "5_Outside_CoSupervisor_Format.pdf",
                        file: proposal.outsideCoSupervisorFormatFile,
                    },
                    {
                        name: "6_Outside_Supervisor_Biodata.pdf",
                        file: proposal.outsideSupervisorBiodataFile,
                    },
                ];
                for (const fileData of filesToInclude) {
                    if (fileData.file) {
                        try {
                            const buffer = await fs.readFile(
                                fileData.file.filePath
                            );
                            studentFolder.file(fileData.name, buffer);
                        } catch (e) {
                            console.warn(
                                `Could not read file ${fileData.file.filePath}`
                            );
                        }
                    }
                }
                for (const review of proposal.dacReviews) {
                    if (review.reviewForm) {
                        const formData = review.reviewForm
                            .formData as phdSchemas.DacReviewFormData;
                        const dacSignatureBuffer = review.dacMember
                            .signatureFile
                            ? await fs
                                  .readFile(
                                      review.dacMember.signatureFile.filePath
                                  )
                                  .catch(() => null)
                            : null;
                        const templateData = {
                            date: new Date().toLocaleDateString("en-IN", {
                                day: "numeric",
                                month: "long",
                                year: "numeric",
                            }),
                            department_name:
                                environment.DEPARTMENT_NAME ||
                                "_______________",
                            dated: new Date(
                                review.createdAt
                            ).toLocaleDateString(),
                            dac_member_name: review.dacMember.name,
                            student_name: proposal.student.name,
                            student_id: proposal.student.idNumber || "N/A",
                            supervisor_name: proposal.supervisor.name,
                            drc_signature: drcSignatureBuffer,
                            dac_signature: dacSignatureBuffer,
                            q1a_yes_xml: formData.q1a
                                ? CHECKED_XML
                                : UNCHECKED_XML,
                            q1a_no_xml: !formData.q1a
                                ? CHECKED_XML
                                : UNCHECKED_XML,
                            q1b_yes_xml: formData.q1b
                                ? CHECKED_XML
                                : UNCHECKED_XML,
                            q1b_no_xml: !formData.q1b
                                ? CHECKED_XML
                                : UNCHECKED_XML,
                            q1c_yes_xml: formData.q1c
                                ? CHECKED_XML
                                : UNCHECKED_XML,
                            q1c_no_xml: !formData.q1c
                                ? CHECKED_XML
                                : UNCHECKED_XML,
                            q2a_yes_xml: formData.q2a
                                ? CHECKED_XML
                                : UNCHECKED_XML,
                            q2a_no_xml: !formData.q2a
                                ? CHECKED_XML
                                : UNCHECKED_XML,
                            q2b_yes_xml: formData.q2b
                                ? CHECKED_XML
                                : UNCHECKED_XML,
                            q2b_no_xml: !formData.q2b
                                ? CHECKED_XML
                                : UNCHECKED_XML,
                            q2c_yes_xml: formData.q2c
                                ? CHECKED_XML
                                : UNCHECKED_XML,
                            q2c_no_xml: !formData.q2c
                                ? CHECKED_XML
                                : UNCHECKED_XML,
                            q3a_yes_xml: formData.q3a
                                ? CHECKED_XML
                                : UNCHECKED_XML,
                            q3a_no_xml: !formData.q3a
                                ? CHECKED_XML
                                : UNCHECKED_XML,
                            q3b_yes_xml: formData.q3b
                                ? CHECKED_XML
                                : UNCHECKED_XML,
                            q3b_no_xml: !formData.q3b
                                ? CHECKED_XML
                                : UNCHECKED_XML,
                            q3c_yes_xml: formData.q3c
                                ? CHECKED_XML
                                : UNCHECKED_XML,
                            q3c_no_xml: !formData.q3c
                                ? CHECKED_XML
                                : UNCHECKED_XML,
                            q4a_yes_xml: formData.q4a
                                ? CHECKED_XML
                                : UNCHECKED_XML,
                            q4a_no_xml: !formData.q4a
                                ? CHECKED_XML
                                : UNCHECKED_XML,
                            q4b_yes_xml: formData.q4b
                                ? CHECKED_XML
                                : UNCHECKED_XML,
                            q4b_no_xml: !formData.q4b
                                ? CHECKED_XML
                                : UNCHECKED_XML,
                            q4c_yes_xml: formData.q4c
                                ? CHECKED_XML
                                : UNCHECKED_XML,
                            q4c_no_xml: !formData.q4c
                                ? CHECKED_XML
                                : UNCHECKED_XML,
                            q4d_yes_xml: formData.q4d
                                ? CHECKED_XML
                                : UNCHECKED_XML,
                            q4d_no_xml: !formData.q4d
                                ? CHECKED_XML
                                : UNCHECKED_XML,
                            q4e_yes_xml: formData.q4e
                                ? CHECKED_XML
                                : UNCHECKED_XML,
                            q4e_no_xml: !formData.q4e
                                ? CHECKED_XML
                                : UNCHECKED_XML,
                            q4f_yes_xml: formData.q4f
                                ? CHECKED_XML
                                : UNCHECKED_XML,
                            q4f_no_xml: !formData.q4f
                                ? CHECKED_XML
                                : UNCHECKED_XML,
                            q4g_yes_xml: formData.q4g
                                ? CHECKED_XML
                                : UNCHECKED_XML,
                            q4g_no_xml: !formData.q4g
                                ? CHECKED_XML
                                : UNCHECKED_XML,
                            q5a_yes_xml: formData.q5a
                                ? CHECKED_XML
                                : UNCHECKED_XML,
                            q5a_no_xml: !formData.q5a
                                ? CHECKED_XML
                                : UNCHECKED_XML,
                            q5b_yes_xml: formData.q5b
                                ? CHECKED_XML
                                : UNCHECKED_XML,
                            q5b_no_xml: !formData.q5b
                                ? CHECKED_XML
                                : UNCHECKED_XML,
                            q5c_yes_xml: formData.q5c
                                ? CHECKED_XML
                                : UNCHECKED_XML,
                            q5c_no_xml: !formData.q5c
                                ? CHECKED_XML
                                : UNCHECKED_XML,
                            q1d_product_xml:
                                formData.q1d === "product"
                                    ? CHECKED_XML
                                    : UNCHECKED_XML,
                            q1d_process_xml:
                                formData.q1d === "process"
                                    ? CHECKED_XML
                                    : UNCHECKED_XML,
                            q1d_frontier_xml:
                                formData.q1d === "frontier"
                                    ? CHECKED_XML
                                    : UNCHECKED_XML,
                            q2d_improve_xml:
                                formData.q2d === "improve"
                                    ? CHECKED_XML
                                    : UNCHECKED_XML,
                            q2d_academic_xml:
                                formData.q2d === "academic"
                                    ? CHECKED_XML
                                    : UNCHECKED_XML,
                            q2d_industry_xml:
                                formData.q2d === "industry"
                                    ? CHECKED_XML
                                    : UNCHECKED_XML,
                            q6_accepted_xml:
                                formData.q6 === "accepted"
                                    ? CHECKED_XML
                                    : UNCHECKED_XML,
                            q6_minor_xml:
                                formData.q6 === "minor"
                                    ? CHECKED_XML
                                    : UNCHECKED_XML,
                            q6_revision_xml:
                                formData.q6 === "revision"
                                    ? CHECKED_XML
                                    : UNCHECKED_XML,
                            q7_reasons: formData.q7_reasons,
                            q8_comments: formData.q8_comments || "",
                        };

                        const imageModule = new ImageModule({
                            centered: false,
                            getImage: (tag: string) => tag,
                            getSize: () => [150, 40],
                        });

                        const zip = new PizZip(dacTemplateContent);
                        const doc = new Docxtemplater(zip, {
                            paragraphLoop: true,
                            linebreaks: true,
                            modules: [imageModule],
                            parser: (tag: string) => {
                                if (tag === "@") {
                                    return {
                                        get(scope: any) {
                                            return scope;
                                        },
                                        type: "raw",
                                        module: "openxml",
                                    };
                                }
                                return null;
                            },
                        });

                        doc.render(templateData);
                        const buf = doc
                            .getZip()
                            .generate({ type: "nodebuffer" });
                        const tempDocxPath = path.join(
                            tempDir,
                            `review_${review.id}.docx`
                        );
                        await fs.writeFile(tempDocxPath, buf);
                        const pdfPath = await convertDocxToPdf(
                            tempDocxPath,
                            tempDir
                        );
                        const pdfBuffer = await fs.readFile(pdfPath);
                        const dacName = `${review.dacMember.name}`.replace(
                            /[\/\\?%*:|"<>]/g,
                            "-"
                        );
                        studentFolder.file(
                            `DAC_Review_${dacName}.pdf`,
                            pdfBuffer
                        );
                    }
                }
            }
            await db
                .update(phdProposals)
                .set({ status: "finalising_documents" })
                .where(
                    inArray(
                        phdProposals.id,
                        proposalsToPackage.map((p) => p.id)
                    )
                );
            const zipBuffer = await zip.generateAsync({ type: "nodebuffer" });
            res.setHeader("Content-Type", "application/zip");
            res.setHeader(
                "Content-Disposition",
                `attachment; filename="ProposalPackages.zip"`
            );
            res.end(zipBuffer);
        } finally {
            await fs.rm(tempDir, { recursive: true, force: true });
        }
    })
);
export default router;
