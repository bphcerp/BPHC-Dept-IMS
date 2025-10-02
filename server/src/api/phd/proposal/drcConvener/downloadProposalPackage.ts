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

        // --- NEW: Image Store Map ---
        // This map will hold all our image buffers, referenced by simple string keys.
        const imageStore = new Map<string, Buffer>();
        imageStore.set("checked", checkedImageBuffer);
        imageStore.set("unchecked", transparentPixelBuffer); // Use transparent pixel for unchecked/null states

        const drcSignatureBuffer = drcUser?.signatureFile
            ? await fs
                  .readFile(drcUser.signatureFile.filePath)
                  .catch(() => null)
            : null;

        if (drcSignatureBuffer) {
            imageStore.set("drc_signature_key", drcSignatureBuffer);
        }

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

                // Add student proposal files to the zip
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

                        // Load DAC signature and add to the image store with a unique key for this review
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

                        const getBoxKey = (condition: boolean) =>
                            condition ? "checked" : "unchecked";

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

                            // MODIFIED: Pass string keys instead of buffers
                            drc_signature: drcSignatureBuffer
                                ? "drc_signature_key"
                                : "unchecked",
                            dac_signature: dacSignatureBuffer
                                ? dacSignatureKey
                                : "unchecked",

                            q1a_yes_box: getBoxKey(formData.q1a),
                            q1a_no_box: getBoxKey(!formData.q1a),
                            q1b_yes_box: getBoxKey(formData.q1b),
                            q1b_no_box: getBoxKey(!formData.q1b),
                            q1c_yes_box: getBoxKey(formData.q1c),
                            q1c_no_box: getBoxKey(!formData.q1c),
                            q2a_yes_box: getBoxKey(formData.q2a),
                            q2a_no_box: getBoxKey(!formData.q2a),
                            q2b_yes_box: getBoxKey(formData.q2b),
                            q2b_no_box: getBoxKey(!formData.q2b),
                            q2c_yes_box: getBoxKey(formData.q2c),
                            q2c_no_box: getBoxKey(!formData.q2c),
                            q3a_yes_box: getBoxKey(formData.q3a),
                            q3a_no_box: getBoxKey(!formData.q3a),
                            q3b_yes_box: getBoxKey(formData.q3b),
                            q3b_no_box: getBoxKey(!formData.q3b),
                            q3c_yes_box: getBoxKey(formData.q3c),
                            q3c_no_box: getBoxKey(!formData.q3c),
                            q4a_yes_box: getBoxKey(formData.q4a),
                            q4a_no_box: getBoxKey(!formData.q4a),
                            q4b_yes_box: getBoxKey(formData.q4b),
                            q4b_no_box: getBoxKey(!formData.q4b),
                            q4c_yes_box: getBoxKey(formData.q4c),
                            q4c_no_box: getBoxKey(!formData.q4c),
                            q4d_yes_box: getBoxKey(formData.q4d),
                            q4d_no_box: getBoxKey(!formData.q4d),
                            q4e_yes_box: getBoxKey(formData.q4e),
                            q4e_no_box: getBoxKey(!formData.q4e),
                            q4f_yes_box: getBoxKey(formData.q4f),
                            q4f_no_box: getBoxKey(!formData.q4f),
                            q4g_yes_box: getBoxKey(formData.q4g),
                            q4g_no_box: getBoxKey(!formData.q4g),
                            q5a_yes_box: getBoxKey(formData.q5a),
                            q5a_no_box: getBoxKey(!formData.q5a),
                            q5b_yes_box: getBoxKey(formData.q5b),
                            q5b_no_box: getBoxKey(!formData.q5b),
                            q5c_yes_box: getBoxKey(formData.q5c),
                            q5c_no_box: getBoxKey(!formData.q5c),
                            q1d_product_box: getBoxKey(
                                formData.q1d.includes("product")
                            ),
                            q1d_process_box: getBoxKey(
                                formData.q1d.includes("process")
                            ),
                            q1d_frontier_box: getBoxKey(
                                formData.q1d.includes("frontier")
                            ),
                            q2d_improve_box: getBoxKey(
                                formData.q2d.includes("improve")
                            ),
                            q2d_academic_box: getBoxKey(
                                formData.q2d.includes("academic")
                            ),
                            q2d_industry_box: getBoxKey(
                                formData.q2d.includes("industry")
                            ),
                            q6_accepted_box: getBoxKey(
                                formData.q6 === "accepted"
                            ),
                            q6_minor_box: getBoxKey(formData.q6 === "minor"),
                            q6_revision_box: getBoxKey(
                                formData.q6 === "revision"
                            ),
                            q7_reasons: formData.q7_reasons,
                            q8_comments: formData.q8_comments || "",
                        };

                        const imageModule = new ImageModule({
                            centered: false,
                            // MODIFIED: getImage now looks up the buffer in our imageStore using the string key
                            getImage: (tag: string) => {
                                return imageStore.get(tag);
                            },
                            getSize: () => [12, 12],
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
