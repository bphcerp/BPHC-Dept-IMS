import express from "express";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import { checkAccess } from "@/middleware/auth.ts";
import { sendEmail } from "@/lib/common/email.ts";
import { HttpError, HttpCode } from "@/config/errors.ts";
import assert from "assert";
import db from "@/config/db/index.ts";
import {
  phdEmailTemplates,
  phdExaminerAssignments,
} from "@/config/db/schema/phd.ts";
import { eq, and } from "drizzle-orm";
import { phdSchemas } from "lib";
import environment from "@/config/environment.ts";
import { Attachment } from "nodemailer/lib/mailer/index.js";
import Mustache from "mustache";

const router = express.Router();

export default router.post(
  "/:applicationId",
  checkAccess(),
  asyncHandler(async (req, res) => {
    assert(req.user, "User must be defined");
    const { area, isReminder } = phdSchemas.notifyExaminerPayloadSchema.parse(
      req.body,
    );
    const applicationId = parseInt(req.params.applicationId);

    if (isNaN(applicationId)) {
      throw new HttpError(HttpCode.BAD_REQUEST, "Invalid application ID");
    }

    const assignment = await db.query.phdExaminerAssignments.findFirst({
      where: and(
        eq(phdExaminerAssignments.applicationId, applicationId),
        eq(phdExaminerAssignments.qualifyingArea, area),
      ),
      with: {
        application: {
          with: {
            student: true,
          },
        },
      },
    });

    if (!assignment) {
      throw new HttpError(
        HttpCode.NOT_FOUND,
        "Examiner assignment not found for the specified area.",
      );
    }

    const templateName = isReminder
      ? "reminder_examiner_qp"
      : "notify_examiner_assignment";
    const template = await db.query.phdEmailTemplates.findFirst({
      where: eq(phdEmailTemplates.name, templateName),
    });

    if (!template) {
      throw new HttpError(
        HttpCode.INTERNAL_SERVER_ERROR,
        `Email template '${templateName}' not found.`,
      );
    }
    const view = {
      examinerName: "Faculty Member", // We don't have examiner name easily accessible, can be added later
      studentName: assignment.application.student.name,
      qualifyingArea: assignment.qualifyingArea,
    };

    const subject = Mustache.render(template.subject, view);
    const htmlBody = Mustache.render(template.body, view);

    const syllabusFileId =
      assignment.application.qualifyingArea1 === area
        ? assignment.application.qualifyingArea1SyllabusFileId
        : assignment.application.qualifyingArea2SyllabusFileId;

    if (!syllabusFileId) {
      throw new HttpError(
        HttpCode.BAD_REQUEST,
        "Syllabus file not found for the specified area.",
      );
    }

    await sendEmail({
      to: assignment.examinerEmail,
      subject,
      html: htmlBody,
      attachments: [
        {
          filename: `Syllabus_${assignment.qualifyingArea}_${
            assignment.application.student.idNumber ??
            assignment.application.studentEmail.split("@")[0]
          }.pdf`,
          href: `${environment.SERVER_URL}/f/${syllabusFileId}`,
        } as Attachment,
      ],
    });

    await db
      .update(phdExaminerAssignments)
      .set({ notifiedAt: new Date() })
      .where(eq(phdExaminerAssignments.id, assignment.id));

    res.status(200).send({ success: true, message: "Notification sent." });
  }),
);