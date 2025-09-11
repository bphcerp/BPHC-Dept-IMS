import express from "express";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import { checkAccess } from "@/middleware/auth.ts";
import { HttpError, HttpCode } from "@/config/errors.ts";
import db from "@/config/db/index.ts";
import JSZip from "jszip";
import puppeteer from "puppeteer";
import fs from "fs/promises";
import { phdProposals } from "@/config/db/schema/phd.ts";
import { and, eq } from "drizzle-orm";
import environment from "@/config/environment.ts";
import { faculty } from "@/config/db/schema/admin.ts";

const router = express.Router();

const generateNoticeHtml = (proposals: any[], drcConvenerName: string) => {
    const rows = proposals
        .map(
            (p: any) => `
      <tr>
        <td>${p.student.name || ""}<br/>${p.student.idNumber || ""}</td>
        <td>${p.title}</td>
        <td>${p.supervisor.name || p.supervisor.email}</td>
        <td>${p.dacMembers.map((m: any) => m.dacMember.name).join("<br/>")}</td>
        <td>${new Date(p.seminarDate).toLocaleDateString()} at ${p.seminarTime}</td>
        <td>${p.seminarVenue}</td>
      </tr>`
        )
        .join("");

    return `<!DOCTYPE html>
    <html lang="en">
    <head><meta charset="UTF-8"><title>PhD Proposal Seminar Notice</title><style>body{font-family:Arial,sans-serif;max-width:800px;margin:0 auto;padding:20px;line-height:1.6;}h1{text-align:center;margin-bottom:30px;}table{width:100%;border-collapse:collapse;margin:20px 0;}th,td{border:1px solid #000;padding:8px;text-align:left;vertical-align:top;}th{background-color:#f5f5f5;font-weight:bold;}.signature{margin-top:30px;text-align:right;}.welcome{margin:20px 0;text-align:center;}</style></head>
    <body>
        <h1>PhD Proposal Seminar Notice</h1>
        <p>Dear Sir/Madam,</p>
        <p>The following candidates from the Department of ${
            environment.DEPARTMENT_NAME || "___________________"
        } are presenting their PhD proposal seminar as per the following schedule.</p>
        <table>
            <thead><tr><th>Name of student and ID No.</th><th>Proposed Topic of Research</th><th>Supervisor/Co-supervisor</th><th>DAC Members</th><th>Date & Time</th><th>Venue</th></tr></thead>
            <tbody>${rows}</tbody>
        </table>
        <p class="welcome">All are welcome to attend the seminar.</p>
        <div class="signature">
            <p>(${drcConvenerName})<br>DRC Convener<br>Department of ${
                environment.DEPARTMENT_NAME || "_______________________"
            }</p>
        </div>
    </body></html>`;
};

const generateDacReviewHtml = (review: any, proposal: any) => {
    const formData = review.reviewForm.formData;
    const tick = (value: boolean) => (value ? "☑" : "☐");
    const tickEnum = (val: string, expected: string) =>
        val === expected ? "☑" : "☐";

    return `<!DOCTYPE html>
    <html lang="en">
    <head><meta charset="UTF-8"><title>Format for Evaluation of Research Proposals</title><style>body{font-family:Arial,sans-serif;max-width:900px;margin:20px auto;line-height:1.5;}h1,h2{text-align:center;}h2{margin-top:40px;}p,label{font-size:14px;}.section{margin-bottom:20px;}.checkbox-row{margin-left:20px;margin-bottom:10px;}textarea{width:100%;height:60px;border:1px solid #ccc;padding:5px;background:#f9f9f9;}.signature-section{margin-top:40px;}</style></head>
    <body>
        <h1>Format for Evaluation of the Research Proposals</h1>
        <h2>BIRLA INSTITUTE OF TECHNOLOGY AND SCIENCE PILANI, HYDERABAD CAMPUS</h2>
        <h2>DEPARTMENT OF ${environment.DEPARTMENT_NAME || "___________________"}</h2>
        <p><b>Dated:</b> ${new Date(review.createdAt).toLocaleDateString()}</p>
        <p><b>To:</b> Prof./Dr. ${review.dacMember.name}</p>
        <p><b>Sub:</b> Review of Doctoral Research Proposal.</p>
        <hr/>
        <p><b>Name of Candidate:</b> ${proposal.student.name} &nbsp;&nbsp;&nbsp; <b>ID No.:</b> ${
            proposal.student.idNumber || "N/A"
        }</p>
        <p><b>Name of Proposed Supervisor:</b> ${proposal.supervisor.name}</p>
        <hr/>
        <h2>Proforma for Review of Doctoral Research Proposal</h2>
        
        <div class="section">
            <h3>1. Proposed Topic of Research</h3>
            <div class="checkbox-row">a) Is the proposed topic in one of the research areas of the Institute? <b>${tick(
                formData.q1a
            )} Yes</b> &nbsp; ${tick(!formData.q1a)} No</div>
            <div class="checkbox-row">b) Does the proposed topic reflect the theme propounded in the proposal write up? <b>${tick(
                formData.q1b
            )} Yes</b> &nbsp; ${tick(!formData.q1b)} No</div>
            <div class="checkbox-row">c) Is the proposed topic relevant to the needs of the immediate environment? <b>${tick(
                formData.q1c
            )} Yes</b> &nbsp; ${tick(!formData.q1c)} No</div>
            <div class="checkbox-row">d) Does the proposed topic aim at:<br>
                &nbsp;&nbsp; ${tickEnum(formData.q1d, "product")} designing an innovative product<br>
                &nbsp;&nbsp; ${tickEnum(formData.q1d, "process")} designing a new process or a system<br>
                &nbsp;&nbsp; ${tickEnum(
                    formData.q1d,
                    "frontier"
                )} taking up research in an advanced frontier area
            </div>
        </div>
        
        <div class="section">
            <h3>2. Objective of the proposed research</h3>
            <div class="checkbox-row">a) Are objectives clearly spelt out? <b>${tick(
                formData.q2a
            )} Yes</b> &nbsp; ${tick(!formData.q2a)} No</div>
            <div class="checkbox-row">b) Are objectives derived based on the literature survey? <b>${tick(
                formData.q2b
            )} Yes</b> &nbsp; ${tick(!formData.q2b)} No</div>
            <div class="checkbox-row">c) Is the outcome of the work clearly visualized? <b>${tick(
                formData.q2c
            )} Yes</b> &nbsp; ${tick(!formData.q2c)} No</div>
            <div class="checkbox-row">d) The outcome of the work: <br>
                &nbsp;&nbsp; ${tickEnum(formData.q2d, "improve")} will improve the present state of art<br>
                &nbsp;&nbsp; ${tickEnum(
                    formData.q2d,
                    "academic"
                )} will only be of an academic interest<br>
                &nbsp;&nbsp; ${tickEnum(formData.q2d, "industry")} will be useful for the industries
            </div>
        </div>

        <div class="section">
            <h3>3. Background of the Proposed Research</h3>
            <div class="checkbox-row">a) Is the literature survey up-to-date and adequately done? <b>${tick(
                formData.q3a
            )} Yes</b> &nbsp; ${tick(!formData.q3a)} No</div>
            <div class="checkbox-row">b) Is a broad summary of the present status given? <b>${tick(
                formData.q3b
            )} Yes</b> &nbsp; ${tick(!formData.q3b)} No</div>
            <div class="checkbox-row">c) Are unsolved academic issues in the area highlighted? <b>${tick(
                formData.q3c
            )} Yes</b> &nbsp; ${tick(!formData.q3c)} No</div>
        </div>
        
        <div class="section">
            <h3>4. Methodology</h3>
            <div class="checkbox-row">a) Is the methodology for literature survey given? <b>${tick(
                formData.q4a
            )} Yes</b> &nbsp; ${tick(!formData.q4a)} No</div>
            <div class="checkbox-row">b) Are data sources identified? <b>${tick(
                formData.q4b
            )} Yes</b> &nbsp; ${tick(!formData.q4b)} No</div>
            <div class="checkbox-row">c) Are experimental facilities clearly envisaged? <b>${tick(
                formData.q4c
            )} Yes</b> &nbsp; ${tick(!formData.q4c)} No</div>
            <div class="checkbox-row">d) Are envisaged experimental set-ups available? <b>${tick(
                formData.q4d
            )} Yes</b> &nbsp; ${tick(!formData.q4d)} No</div>
            <div class="checkbox-row">e) If not available, is it explained how work will be carried out? <b>${tick(
                formData.q4e
            )} Yes</b> &nbsp; ${tick(!formData.q4e)} No</div>
            <div class="checkbox-row">f) Are required computing facilities available? <b>${tick(
                formData.q4f
            )} Yes</b> &nbsp; ${tick(!formData.q4f)} No</div>
            <div class="checkbox-row">g) Is methodology for completion clearly spelt out? <b>${tick(
                formData.q4g
            )} Yes</b> &nbsp; ${tick(!formData.q4g)} No</div>
        </div>

        <div class="section">
            <h3>5. Literature References</h3>
            <div class="checkbox-row">a) Is citation done in a standard format? <b>${tick(
                formData.q5a
            )} Yes</b> &nbsp; ${tick(!formData.q5a)} No</div>
            <div class="checkbox-row">b) Is cited literature referred in the text? <b>${tick(
                formData.q5b
            )} Yes</b> &nbsp; ${tick(!formData.q5b)} No</div>
            <div class="checkbox-row">c) Is cited literature relevant to the proposed work? <b>${tick(
                formData.q5c
            )} Yes</b> &nbsp; ${tick(!formData.q5c)} No</div>
        </div>
        
        <div class="section">
            <h3>6. Overall Comments</h3>
            <div class="checkbox-row">
                ${tickEnum(formData.q6, "accepted")} Proposal may be accepted<br>
                ${tickEnum(formData.q6, "minor")} Proposal needs minor modifications<br>
                ${tickEnum(formData.q6, "revision")} Proposal needs revision
            </div>
        </div>
        
        <div class="section">
            <h3>7. Reasons for recommendation at item No. 6:</h3>
            <textarea readonly>${formData.q7_reasons}</textarea>
        </div>
        
        <div class="section">
            <h3>8. Any other comments:</h3>
            <textarea readonly>${formData.q8_comments || ""}</textarea>
        </div>
        
        <div class="signature-section">
            <p><b>Dated:</b> ${new Date(review.createdAt).toLocaleDateString()}</p>
            <p style="margin-top: 40px;">_________________</p>
            <p>Signature</p>
            <p><b>${review.dacMember.name}</b></p>
            <p>Name of faculty member</p>
        </div>
    </body></html>`;
};

router.get(
    "/:proposalId",
    checkAccess(),
    asyncHandler(async (req, res) => {
        const proposalId = parseInt(req.params.proposalId);
        if (isNaN(proposalId)) {
            throw new HttpError(HttpCode.BAD_REQUEST, "Invalid Proposal ID");
        }

        const proposalToPackage = await db.query.phdProposals.findFirst({
            where: and(
                eq(phdProposals.id, proposalId),
                eq(phdProposals.status, "seminar_details_pending")
            ),
            with: {
                student: true,
                supervisor: true,
                dacMembers: { with: { dacMember: true } },
                dacReviews: {
                    with: {
                        dacMember: true,
                        reviewForm: true,
                        feedbackFile: true,
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

        if (!proposalToPackage) {
            throw new HttpError(
                HttpCode.NOT_FOUND,
                "No completed proposal with seminar details found to generate a package."
            );
        }

        const drcUser = await db.query.faculty.findFirst({
            where: eq(faculty.email, req.user!.email),
            columns: { name: true },
        });
        const drcConvenerName = drcUser?.name || req.user!.email;

        const zip = new JSZip();
        const browser = await puppeteer.launch({
            headless: true,
            args: ["--no-sandbox"],
        });

        try {
            const page = await browser.newPage();

            const noticeHtml = generateNoticeHtml(
                [proposalToPackage],
                drcConvenerName
            );
            await page.setContent(noticeHtml, { waitUntil: "networkidle0" });
            const noticePdf = await page.pdf({
                format: "A4",
                printBackground: true,
            });
            zip.file("Seminar_Notice.pdf", noticePdf);

            const studentFolderName = `${
                proposalToPackage.student.name ||
                proposalToPackage.student.email
            }`.replace(/[\/\\?%*:|"<>]/g, "-");
            const studentFolder = zip.folder(studentFolderName);
            if (!studentFolder)
                throw new Error("Could not create student folder in zip.");

            const filesToInclude = [
                {
                    name: "1_Appendix_I.pdf",
                    file: proposalToPackage.appendixFile,
                },
                { name: "2_Summary.pdf", file: proposalToPackage.summaryFile },
                { name: "3_Outline.pdf", file: proposalToPackage.outlineFile },
                {
                    name: "4_Place_of_Research.pdf",
                    file: proposalToPackage.placeOfResearchFile,
                },
                {
                    name: "5_Outside_CoSupervisor_Format.pdf",
                    file: proposalToPackage.outsideCoSupervisorFormatFile,
                },
                {
                    name: "6_Outside_Supervisor_Biodata.pdf",
                    file: proposalToPackage.outsideSupervisorBiodataFile,
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

            for (const review of proposalToPackage.dacReviews) {
                if (review.reviewForm) {
                    const reviewHtml = generateDacReviewHtml(
                        review,
                        proposalToPackage
                    );
                    await page.setContent(reviewHtml, {
                        waitUntil: "networkidle0",
                    });
                    const reviewPdf = await page.pdf({
                        format: "A4",
                        printBackground: true,
                    });
                    const dacName = `${review.dacMember.name}`.replace(
                        /[\/\\?%*:|"<>]/g,
                        "-"
                    );
                    studentFolder.file(`DAC_Review_${dacName}.pdf`, reviewPdf);
                }
            }
        } finally {
            await browser.close();
        }

        const zipBuffer = await zip.generateAsync({ type: "nodebuffer" });
        res.setHeader("Content-Type", "application/zip");
        res.setHeader(
            "Content-Disposition",
            `attachment; filename="ProposalPackage-${proposalId}.zip"`
        );
        res.end(zipBuffer);
    })
);

export default router;
