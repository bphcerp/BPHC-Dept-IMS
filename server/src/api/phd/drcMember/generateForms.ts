import express from "express";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import { checkAccess } from "@/middleware/auth.ts";
import { HttpError, HttpCode } from "@/config/errors.ts";
import db from "@/config/db/index.ts";
import { phdExamApplications } from "@/config/db/schema/phd.ts";
import { eq, and, inArray } from "drizzle-orm";
import puppeteer from "puppeteer";

const router = express.Router();

// HTML template for the form
const getFormTemplate = (applications: any[], examInfo?: any) => `
<!doctype html>
<html>
    <head>
        <meta charset="UTF-8" />
        <title>Intimation to AGSRD for PhD Qualifying Examination</title>
        <style>
            body {
                margin: 40px;
                line-height: 1.5;
            }
            .underline {
                border-bottom: 1px solid #000;
                display: inline-block;
                width: 200px;
                margin: 0 5px;
            }
            table {
                width: 100%;
                margin-bottom: 20px;
            }
            table,
            th,
            td {
                border: 1px solid #000;
            }
            th,
            td {
                padding: 8px;
                text-align: center;
                vertical-align: middle;
            }
            .multiline-header {
                line-height: 1.2;
            }
            .header-section {
                text-align: center;
                margin-bottom: 20px;
            }
        </style>
    </head>
    <body>
        <div class="header-section">
            <h2>Intimation to AGSRD for PhD Qualifying Examination</h2>
            <p>
                BIRLA INSTITUTE OF TECHNOLOGY AND SCIENCE PILANI,<br />
                CAMPUS<br />
                DEPARTMENT OF &emsp;
            </p>
            <p>Date: ${new Date().toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
            })}</p>
            <p>
                To,<br />
                Associate Dean, AGSRD<br />
                BITS Pilani, &emsp; campus.
            </p>
            <p>
                The Department will be conducting PhD qualifying examination as
                per following-
            </p>
        </div>
        <p>
            1. Date of Examination - From. <span class="underline">${examInfo?.examStartDate ? new Date(examInfo.examStartDate).toLocaleDateString() : "___________"}</span> to.
            <span class="underline">${examInfo?.examEndDate ? new Date(examInfo.examEndDate).toLocaleDateString() : "___________"}</span>
        </p>
        <p>2. Room number - <span class="underline">___________</span></p>
        <p>3. List of candidates who will be appearing in the examination-</p>
        <table>
            <thead>
                <tr>
                    <th>Sl No</th>
                    <th class="multiline-header">
                        ID No/<br />
                        Application No/<br />
                        PSRN
                    </th>
                    <th>Name</th>
                    <th class="multiline-header">
                        First attempt/<br />
                        second Attempt
                    </th>
                    <th class="multiline-header">
                        Name of two PhD<br />
                        qualifying areas
                    </th>
                </tr>
            </thead>
            <tbody>
                ${applications
                    .map(
                        (app, index) => `
                <tr>
                    <td>${index + 1}</td>
                    <td>${app.student.idNumber || app.student.erpId || "N/A"}</td>
                    <td>${app.student.name || "N/A"}</td>
                    <td>First attempt</td>
                    <td>
                        1. ${app.qualifyingArea1 || "N/A"}<br />
                        2. ${app.qualifyingArea2 || "N/A"}
                    </td>
                </tr>
                `
                    )
                    .join("")}
            </tbody>
        </table>
        <br />
        <p>
            (Name)<br />
            (DRC Convener)<br />
            Date: ${new Date().toLocaleDateString()}
        </p>
        <br />
        <p>
            (Name)<br />
            (HOD)<br />
            Date: ${new Date().toLocaleDateString()}
        </p>
    </body>
</html>
`;

router.post(
    "/",
    checkAccess(),
    asyncHandler(async (req, res, next) => {
        const { applicationIds } = req.body;

        if (
            !applicationIds ||
            !Array.isArray(applicationIds) ||
            applicationIds.length === 0
        ) {
            return next(
                new HttpError(
                    HttpCode.BAD_REQUEST,
                    "Application IDs array is required"
                )
            );
        }

        // Fetch the applications with student details
        const applications = await db.query.phdExamApplications.findMany({
            where: and(
                inArray(phdExamApplications.id, applicationIds),
                eq(phdExamApplications.status, "verified")
            ),
            with: {
                student: true,
                exam: true,
            },
        });

        if (applications.length === 0) {
            return next(
                new HttpError(
                    HttpCode.NOT_FOUND,
                    "No verified applications found with the provided IDs"
                )
            );
        }

        // Transform applications for the template
        const transformedApplications = applications.map((app) => ({
            id: app.id,
            status: app.status,
            comments: app.comments,
            qualifyingArea1: app.qualifyingArea1,
            qualifyingArea2: app.qualifyingArea2,
            createdAt: app.createdAt.toISOString(),
            updatedAt: app.updatedAt.toISOString(),
            student: {
                email: app.student.email,
                name: app.student.name,
                erpId: app.student.erpId,
                phone: app.student.phone,
                supervisor: app.student.supervisorEmail,
                idNumber: app.student.idNumber,
                coSupervisor1: app.student.coSupervisorEmail,
                coSupervisor2: app.student.coSupervisorEmail2,
            },
            exam: app.exam,
        }));

        // Generate HTML content for all applications
        const htmlContent = getFormTemplate(
            transformedApplications,
            transformedApplications[0]?.exam
        );

        // Launch Puppeteer to generate PDF
        const browser = await puppeteer.launch({
            headless: true,
            args: [
                "--no-sandbox",
                "--disable-setuid-sandbox",
                "--disable-web-security",
                "--disable-features=VizDisplayCompositor",
            ],
        });

        try {
            const page = await browser.newPage();

            // Set viewport and wait for content to load
            await page.setViewport({ width: 1200, height: 800 });
            await page.setContent(htmlContent, {
                waitUntil: ["networkidle0", "domcontentloaded"],
            });

            const pdf = await page.pdf({
                format: "A4",
                margin: {
                    top: "40px",
                    right: "40px",
                    bottom: "40px",
                    left: "40px",
                },
                printBackground: true,
                preferCSSPageSize: false,
                displayHeaderFooter: false,
            });

            await browser.close();

            // Set response headers for PDF download
            const filename = `qualifying-exam-forms-${new Date().toISOString().split("T")[0]}.pdf`;
            res.setHeader("Content-Type", "application/pdf");
            res.setHeader("Content-Length", pdf.length.toString());
            res.setHeader(
                "Content-Disposition",
                `attachment; filename="${filename}"`
            );
            res.setHeader(
                "Cache-Control",
                "no-cache, no-store, must-revalidate"
            );
            res.setHeader("Pragma", "no-cache");
            res.setHeader("Expires", "0");

            res.end(pdf);
        } catch (error) {
            await browser.close();
            throw error;
        }
    })
);

export default router;
