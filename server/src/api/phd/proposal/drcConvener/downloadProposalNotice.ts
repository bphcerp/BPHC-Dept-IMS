import express from "express";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import { checkAccess } from "@/middleware/auth.ts";
import { HttpError, HttpCode } from "@/config/errors.ts";
import db from "@/config/db/index.ts";
import puppeteer from "puppeteer";
import { phdProposals } from "@/config/db/schema/phd.ts";
import { inArray } from "drizzle-orm";
import environment from "@/config/environment.ts";
import { z } from "zod";

const downloadNoticeSchema = z.object({
    proposalIds: z.array(z.number().int().positive()).min(1),
});
const generateNoticeHtml = (proposals: any[], drcConvenerName: string) => {
    const rows = proposals
        .map(
            (p: any) =>
                ` <tr> <td>${p.student.name || ""}<br/>${p.student.idNumber || ""}</td> <td>${p.title}</td> <td>${p.supervisor.name || p.supervisor.email}</td> <td>${p.dacMembers.map((m: any) => m.dacMember.name).join("<br/>")}</td> <td>${new Date(p.seminarDate).toLocaleDateString()}at ${p.seminarTime}</td> <td>${p.seminarVenue}</td> </tr>`
        )
        .join("");
    return `<!DOCTYPE html> <html lang="en"> <head><meta charset="UTF-8"><title>PhD Proposal Seminar Notice</title><style>body{font-family:Arial,sans-serif;max-width:800px;margin:0 auto;padding:20px;line-height:1.6;}h1{text-align:center;margin-bottom:30px;}table{width:100%;border-collapse:collapse;margin:20px 0;}th,td{border:1px solid <body> <h1>PhD Proposal Seminar Notice</h1> <p>Dear Sir/Madam,</p> <p>The following candidates from the Department of ${environment.DEPARTMENT_NAME || "___________________"}are presenting their PhD proposal seminar as per the following schedule.</p> <table> <thead><tr><th>Name of student and ID No.</th><th>Proposed Topic of Research</th><th>Supervisor/Co-supervisor</th><th>DAC Members</th><th>Date & Time</th><th>Venue</th></tr></thead> <tbody>${rows}</tbody> </table> <p class="welcome">All are welcome to attend the seminar.</p> <div class="signature"> <p>(${drcConvenerName})<br>DRC Convener<br>Department of ${environment.DEPARTMENT_NAME || "_______________________"}</p> </div> </body></html>`;
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
                dacMembers: { with: { dacMember: true } },
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
                (p) => p.status !== "seminar_incomplete"
            )
        ) {
            throw new HttpError(
                HttpCode.BAD_REQUEST,
                "One or more selected proposals are not ready for a notice (status is not 'seminar_details_pending')."
            );
        }
        const drcUser = await db.query.faculty.findFirst({
            where: (cols, { eq }) => eq(cols.email, req.user!.email),
            columns: { name: true },
        });
        const drcConvenerName = drcUser?.name || req.user!.email;
        const browser = await puppeteer.launch({
            headless: true,
            args: ["--no-sandbox"],
        });
        try {
            const page = await browser.newPage();
            const noticeHtml = generateNoticeHtml(
                proposalsForNotice,
                drcConvenerName
            );
            await page.setContent(noticeHtml, { waitUntil: "networkidle0" });
            const noticePdf = await page.pdf({
                format: "A4",
                printBackground: true,
            });
            res.setHeader("Content-Type", "application/pdf");
            res.setHeader(
                "Content-Disposition",
                `attachment; filename="Seminar_Notice.pdf"`
            );
            res.end(noticePdf);
        } finally {
            await browser.close();
        }
    })
);
export default router;
