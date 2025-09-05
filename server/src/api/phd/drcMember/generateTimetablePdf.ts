import express from "express";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import { checkAccess } from "@/middleware/auth.ts";
import { HttpError, HttpCode } from "@/config/errors.ts";
import db from "@/config/db/index.ts";
import { phdExamTimetableSlots, phdQualifyingExams } from "@/config/db/schema/phd.ts";
import { eq } from "drizzle-orm";
import puppeteer from "puppeteer";

const router = express.Router();

const getTimetableHtmlTemplate = (
  examDetails: any,
  timetable: {
    slot1: any[];
    slot2: any[];
    unscheduled: any[];
  },
  examinersWithDoubleDuty: string[],
) => {
    const examDate = new Date(examDetails.examStartDate);

    const renderSlot = (slotNumber: number, slotData: any[]) => {
      if (slotData.length === 0) return `<div class="slot"><h2>Slot ${slotNumber}</h2><p>No exams scheduled.</p></div>`;
      return `
        <div class="slot">
            <h2>Slot ${slotNumber}</h2>
            <table>
                <thead>
                    <tr>
                        <th>Student Name</th>
                        <th>Qualifying Area</th>
                        <th>Examiner</th>
                    </tr>
                </thead>
                <tbody>
                    ${slotData.map(item => `
                        <tr>
                            <td>${item.student?.name || item.studentEmail}</td>
                            <td>${item.qualifyingArea}</td>
                            <td>${item.examinerEmail}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `};

    return `
    <!DOCTYPE html>
    <html>
    <head>
        <title>PhD Qualifying Exam Timetable</title>
        <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; margin: 2rem; color: #333; }
            h1, h2, p { margin: 0 0 0.5rem 0; }
            .header { margin-bottom: 2rem; text-align: center; border-bottom: 2px solid #eee; padding-bottom: 1rem;}
            .header h1 { font-size: 24px; }
            .header p { font-size: 16px; color: #555; }
            .timetable-container { display: flex; flex-direction: column; gap: 2rem; }
            .slot { page-break-inside: avoid; }
            table { width: 100%; border-collapse: collapse; margin-top: 1rem; }
            th, td { border: 1px solid #ddd; padding: 10px; text-align: left; font-size: 14px; }
            th { background-color: #f7f7f7; font-weight: 600; }
            tr:nth-child(even) { background-color: #fdfdfd; }
            .notes { margin-top: 2.5rem; border-top: 2px solid #eee; padding-top: 1.5rem; page-break-inside: avoid; }
            .notes h2 { font-size: 18px; margin-bottom: 1rem; }
            .notes ul { list-style-type: disc; padding-left: 20px; }
            .notes li { margin-bottom: 0.5rem; }
        </style>
    </head>
    <body>
        <div class="header">
            <h1>PhD Qualifying Exam Timetable</h1>
            <p><strong>Exam:</strong> ${examDetails.examName}</p>
            <p><strong>Date:</strong> ${examDate.toLocaleDateString('en-US', { dateStyle: 'long' })}</p>
        </div>

        <div class="timetable-container">
            ${renderSlot(1, timetable.slot1)}
            ${renderSlot(2, timetable.slot2)}
        </div>

        ${timetable.unscheduled.length > 0 ? `
        <div class="notes">
            <h2>Unscheduled Students</h2>
            <ul>
                ${[...new Set(timetable.unscheduled.map(item => item.student?.name || item.studentEmail))].map(name => `<li>${name}</li>`).join('')}
            </ul>
        </div>
        ` : ''}

        ${examinersWithDoubleDuty.length > 0 ? `
        <div class="notes">
            <h2>Notes for Examiners</h2>
            <p>The following examiners are assigned duties in both slots and are required to prepare two different question papers for their respective qualifying areas:</p>
            <ul>
                ${examinersWithDoubleDuty.map(email => `<li>${email}</li>`).join('')}
            </ul>
        </div>
        ` : ''}
    </body>
    </html>
    `;
};


export default router.get(
  "/:examId",
  checkAccess("phd:drc:qe"),
  asyncHandler(async (req, res, next) => {
    const examId = parseInt(req.params.examId);
    if (isNaN(examId)) {
      return next(new HttpError(HttpCode.BAD_REQUEST, "Invalid Exam ID"));
    }
    
    const examDetails = await db.query.phdQualifyingExams.findFirst({
        where: eq(phdQualifyingExams.id, examId),
    });

    if (!examDetails) {
        return next(new HttpError(HttpCode.NOT_FOUND, "Exam not found."));
    }

    const slots = await db.query.phdExamTimetableSlots.findMany({
      where: eq(phdExamTimetableSlots.examId, examId),
      with: { student: { columns: { name: true } } },
    });

    const timetable = {
      slot1: slots.filter((s) => s.slotNumber === 1),
      slot2: slots.filter((s) => s.slotNumber === 2),
      unscheduled: slots.filter((s) => s.slotNumber === 0),
    };

    const examinerDuties = slots.reduce((acc, slot) => {
        if (slot.slotNumber > 0) {
            if (!acc[slot.examinerEmail]) acc[slot.examinerEmail] = new Set();
            acc[slot.examinerEmail].add(slot.slotNumber);
        }
        return acc;
    }, {} as Record<string, Set<number>>);

    const examinersWithDoubleDuty = Object.entries(examinerDuties)
      .filter(([, dutySlots]) => dutySlots.size > 1)
      .map(([examinerEmail]) => examinerEmail);

    const htmlContent = getTimetableHtmlTemplate(examDetails, timetable, examinersWithDoubleDuty);

    const browser = await puppeteer.launch({ headless: true, args: ["--no-sandbox", "--disable-gpu", "--disable-dev-shm-usage", "--disable-setuid-sandbox", "--no-first-run", "--no-zygote" ] });
    try {
        const page = await browser.newPage();
        await page.setContent(htmlContent, { waitUntil: "networkidle0" });
        const pdf = await page.pdf({ format: "A4", printBackground: true });
        res.setHeader("Content-Type", "application/pdf");
        res.setHeader("Content-Disposition", `attachment; filename="Timetable-Exam-${examId}.pdf"`);
        res.end(pdf);
    } finally {
        await browser.close();
    }
  }),
);