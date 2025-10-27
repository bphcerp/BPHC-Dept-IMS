// server/src/api/phd/proposal/drcConvener/downloadProposalPackage.ts
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
    // Added space before ${docxPath}
    const command = `libreoffice --headless --nologo --convert-to pdf --outdir ${outputDir} ${docxPath}`;
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
        const checkedImagePath = path.join(
            import.meta.dirname,
            "./checked.png"
        );

        const transparentPixelBuffer = Buffer.from(
            "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=",
            "base64"
        );

        const [dacTemplateContent, checkedImageBuffer] = await Promise.all([
            fs.readFile(dacTemplatePath),
            fs.readFile(checkedImagePath).catch(() => {
                throw new HttpError(
                    HttpCode.INTERNAL_SERVER_ERROR,
                    "checked.png image not found."
                );
            }),
        ]);

        const imageStore = new Map<string, Buffer>();
        imageStore.set("checked", checkedImageBuffer);
        imageStore.set("unchecked", transparentPixelBuffer);

        const drcSignatureBuffer = drcUser?.signatureFile
            ? await fs
                  .readFile(drcUser.signatureFile.filePath)
                  .catch(() => null)
            : null;
        if (drcSignatureBuffer) {
            imageStore.set("drc_signature_key", drcSignatureBuffer);
        }

        // Helper to map boolean OR string to 'checked' or 'unchecked'
        const getBoxKey = (condition: boolean) =>
            condition ? "checked" : "unchecked";

        try {
            for (const proposal of proposalsToPackage) {
                const studentFolderName =
                    `${proposal.student.name || proposal.student.email}`.replace(
                        /[\/\\?%*:|"<>]/g,
                        "-"
                    );
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
                        // Cast to 'any' to handle both old (boolean) and new (string) formats
                        const formData = review.reviewForm.formData as any;

                        const dacSignatureBuffer = review.dacMember
                            .signatureFile
                            ? await fs
                                  .readFile(
                                      review.dacMember.signatureFile.filePath
                                  )
                                  .catch(() => null)
                            : null;
                        const dacSignatureKey = `dac_signature_${review.id}`;
                        if (dacSignatureBuffer) {
                            imageStore.set(dacSignatureKey, dacSignatureBuffer);
                        }

                        // --- BACKWARD-COMPATIBLE MAPPING ---
                        const templateData = {
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
                            drc_signature: drcSignatureBuffer
                                ? "drc_signature_key"
                                : "unchecked",
                            dac_signature: dacSignatureBuffer
                                ? dacSignatureKey
                                : "unchecked",

                            // Q1: Check for new string "yes" OR old boolean true
                            q1a_yes_box: getBoxKey(
                                formData.q1a === "yes" || formData.q1a === true
                            ),
                            q1a_no_box: getBoxKey(
                                formData.q1a === "no" || formData.q1a === false
                            ),
                            q1b_yes_box: getBoxKey(
                                formData.q1b === "yes" || formData.q1b === true
                            ),
                            q1b_no_box: getBoxKey(
                                formData.q1b === "no" || formData.q1b === false
                            ),
                            q1c_yes_box: getBoxKey(
                                formData.q1c === "yes" || formData.q1c === true
                            ),
                            q1c_no_box: getBoxKey(
                                formData.q1c === "no" || formData.q1c === false
                            ),
                            q1d_product_box: getBoxKey(
                                formData.q1d?.includes("product")
                            ),
                            q1d_process_box: getBoxKey(
                                formData.q1d?.includes("process")
                            ),
                            q1d_frontier_box: getBoxKey(
                                formData.q1d?.includes("frontier")
                            ),

                            // Q2
                            q2a_yes_box: getBoxKey(
                                formData.q2a === "yes" || formData.q2a === true
                            ),
                            q2a_no_box: getBoxKey(
                                formData.q2a === "no" || formData.q2a === false
                            ),
                            q2b_yes_box: getBoxKey(
                                formData.q2b === "yes" || formData.q2b === true
                            ),
                            q2b_no_box: getBoxKey(
                                formData.q2b === "no" || formData.q2b === false
                            ),
                            q2c_yes_box: getBoxKey(
                                formData.q2c === "yes" || formData.q2c === true
                            ),
                            q2c_no_box: getBoxKey(
                                formData.q2c === "no" || formData.q2c === false
                            ),
                            q2d_improve_box: getBoxKey(
                                formData.q2d?.includes("improve")
                            ),
                            q2d_academic_box: getBoxKey(
                                formData.q2d?.includes("academic")
                            ),
                            q2d_industry_box: getBoxKey(
                                formData.q2d?.includes("industry")
                            ),

                            // Q3
                            q3a_yes_box: getBoxKey(
                                formData.q3a === "yes" || formData.q3a === true
                            ),
                            q3a_no_box: getBoxKey(
                                formData.q3a === "no" || formData.q3a === false
                            ),
                            q3b_yes_box: getBoxKey(
                                formData.q3b === "yes" || formData.q3b === true
                            ),
                            q3b_no_box: getBoxKey(
                                formData.q3b === "no" || formData.q3b === false
                            ),
                            q3c_yes_box: getBoxKey(
                                formData.q3c === "yes" || formData.q3c === true
                            ),
                            q3c_no_box: getBoxKey(
                                formData.q3c === "no" || formData.q3c === false
                            ),

                            // Q4
                            q4a_yes_box: getBoxKey(
                                formData.q4a === "yes" || formData.q4a === true
                            ),
                            q4a_no_box: getBoxKey(
                                formData.q4a === "no" || formData.q4a === false
                            ),
                            q4b_yes_box: getBoxKey(
                                formData.q4b === "yes" || formData.q4b === true
                            ),
                            q4b_no_box: getBoxKey(
                                formData.q4b === "no" || formData.q4b === false
                            ),
                            q4b_notapp_box: getBoxKey(
                                formData.q4b === "notapp"
                            ),
                            q4c_yes_box: getBoxKey(
                                formData.q4c === "yes" || formData.q4c === true
                            ),
                            q4c_no_box: getBoxKey(
                                formData.q4c === "no" || formData.q4c === false
                            ),
                            q4c_notiden_box: getBoxKey(
                                formData.q4c === "notiden"
                            ),
                            q4c_noapp_box: getBoxKey(formData.q4c === "noapp"),
                            q4d_yes_box: getBoxKey(
                                formData.q4d === "yes" || formData.q4d === true
                            ),
                            q4d_no_box: getBoxKey(
                                formData.q4d === "no" || formData.q4d === false
                            ),
                            q4d_notyet_box: getBoxKey(
                                formData.q4d === "notyet"
                            ),
                            q4d_notapp_box: getBoxKey(
                                formData.q4d === "notapp"
                            ),
                            q4e_yes_box: getBoxKey(
                                formData.q4e === "yes" || formData.q4e === true
                            ),
                            q4e_no_box: getBoxKey(
                                formData.q4e === "no" || formData.q4e === false
                            ),
                            q4f_yes_box: getBoxKey(
                                formData.q4f === "yes" || formData.q4f === true
                            ),
                            q4f_judge_box: getBoxKey(formData.q4f === "judge"),
                            q4f_notapp_box: getBoxKey(
                                formData.q4f === "notapp"
                            ),
                            q4g_yes_box: getBoxKey(
                                formData.q4g === "yes" || formData.q4g === true
                            ),
                            q4g_no_box: getBoxKey(
                                formData.q4g === "no" || formData.q4g === false
                            ),

                            // Q5
                            q5a_yes_box: getBoxKey(
                                formData.q5a === "yes" || formData.q5a === true
                            ),
                            q5a_no_box: getBoxKey(
                                formData.q5a === "no" || formData.q5a === false
                            ),
                            q5b_yes_box: getBoxKey(
                                formData.q5b === "yes" || formData.q5b === true
                            ),
                            q5b_no_box: getBoxKey(
                                formData.q5b === "no" || formData.q5b === false
                            ),
                            q5b_partially_box: getBoxKey(
                                formData.q5b === "partially"
                            ),
                            q5c_yes_box: getBoxKey(
                                formData.q5c === "yes" || formData.q5c === true
                            ),
                            q5c_no_box: getBoxKey(
                                formData.q5c === "no" || formData.q5c === false
                            ),

                            // Q6
                            q6_accepted_box: getBoxKey(
                                formData.q6 === "accepted"
                            ),
                            q6_minor_box: getBoxKey(formData.q6 === "minor"),
                            q6_revision_box: getBoxKey(
                                formData.q6 === "revision"
                            ),

                            // Q7 & Q8
                            q7_reasons: formData.q7_reasons || "", // Handle potentially undefined
                            q8_comments: formData.q8_comments || "",
                        };
                        // --- END OF MAPPING ---

                        const imageModule = new ImageModule({
                            centered: false,
                            getImage: (tag: string): Buffer | undefined =>
                                imageStore.get(tag),
                            getSize: (
                                _img: Buffer,
                                tag: string,
                                _value: unknown
                            ): [number, number] => {
                                if (tag.includes("signature")) return [150, 50];
                                return [12, 12];
                            },
                        });

                        const pizZip = new PizZip(dacTemplateContent);
                        const doc = new Docxtemplater(pizZip, {
                            paragraphLoop: true,
                            linebreaks: true,
                            modules: [imageModule],
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
