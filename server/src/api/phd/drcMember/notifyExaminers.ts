import express from "express";
import { z } from "zod";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import { checkAccess } from "@/middleware/auth.ts";
import db from "@/config/db/index.ts";
import { HttpError, HttpCode } from "@/config/errors.ts";
import { phdExaminerAssignments } from "@/config/db/schema/phd.ts";
import { inArray, and, isNull } from "drizzle-orm";
import { sendBulkEmails } from "@/lib/common/email.ts";
import environment from "@/config/environment.ts";

const router = express.Router();

const notifyExaminersSchema = z.object({
  applicationIds: z.array(z.number().int().positive()),
});

export default router.post(
  "/",
  checkAccess(),
  asyncHandler(async (req, res, next) => {
    const { applicationIds } = notifyExaminersSchema.parse(req.body);

    if (applicationIds.length === 0) {
      next(new HttpError(HttpCode.BAD_REQUEST, "No application IDs provided"));
    }

    const assignmentsToNotify = await db.query.phdExaminerAssignments.findMany({
      where: and(
        inArray(phdExaminerAssignments.applicationId, applicationIds),
        isNull(phdExaminerAssignments.notifiedAt),
      ),
      with: {
        application: {
          with: {
            student: true,
            exam: true,
            qualifyingArea1SyllabusFile: true,
            qualifyingArea2SyllabusFile: true,
          }
        }
      }
    });

    if (assignmentsToNotify.length === 0) {
      res.status(200).json({ success: true, message: "No new examiners to notify." });
    }

    const emailJobs = assignmentsToNotify.map(assignment => {
      const { application } = assignment;
      const { student, exam } = application;

      const syllabusFile = assignment.qualifyingArea === application.qualifyingArea1
        ? application.qualifyingArea1SyllabusFile
        : application.qualifyingArea2SyllabusFile;
      
      const syllabusLink = syllabusFile
        ? `<a href="${environment.SERVER_URL}/f/${syllabusFile.id}">View Syllabus</a>`
        : "Syllabus not available.";

      const emailBody = `
        <p>Dear Examiner,</p>
        <p>You have been assigned as an examiner for the PhD Qualifying Examination.</p>
        <h3>Details:</h3>
        <ul>
          <li><strong>Student Name:</strong> ${student.name} (${student.email})</li>
          <li><strong>Exam:</strong> ${exam.examName}</li>
          <li><strong>Qualifying Area:</strong> ${assignment.qualifyingArea}</li>
          <li><strong>Exam Period:</strong> ${new Date(exam.examStartDate).toLocaleDateString()} to ${new Date(exam.examEndDate).toLocaleDateString()}</li>
          <li><strong>Viva Date:</strong> ${exam.vivaDate ? new Date(exam.vivaDate).toLocaleDateString() : 'To be announced'}</li>
        </ul>
        <p>Please find the syllabus for your assigned area here: ${syllabusLink}</p>
        <p>Further details will be communicated to you shortly.</p>
        <p>Best regards,<br/>PhD Department</p>
      `;

      return {
        to: assignment.examinerEmail,
        subject: `Invitation to be an Examiner for PhD Qualifying Exam - ${student.name}`,
        html: emailBody,
      };
    });

    await sendBulkEmails(emailJobs);

    await db.update(phdExaminerAssignments)
      .set({ notifiedAt: new Date() })
      .where(inArray(phdExaminerAssignments.id, assignmentsToNotify.map(a => a.id)));

    res.status(200).json({ success: true, message: `Successfully sent ${emailJobs.length} notification(s).` });
  }),
);