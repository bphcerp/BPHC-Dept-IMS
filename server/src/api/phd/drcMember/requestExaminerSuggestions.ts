import express from "express";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import { checkAccess } from "@/middleware/auth.ts";
import { modules, phdSchemas } from "lib";
import { createTodos } from "@/lib/todos/index.ts";
import { sendEmail } from "@/lib/common/email.ts";
import { HttpError, HttpCode } from "@/config/errors.ts";
import db from "@/config/db/index.ts";
import {
    phdExamApplications,
    phdExaminerSuggestions,
    phdExaminerAssignments,
} from "@/config/db/schema/phd.ts";
import { eq } from "drizzle-orm";

const router = express.Router();

router.post(
    "/",
    checkAccess(),
    asyncHandler(async (req, res) => {
        const { subject, body, applicationId } =
            phdSchemas.requestExaminerSuggestionsBodySchema.parse(req.body);
        const application = await db.query.phdExamApplications.findFirst({
            where: eq(phdExamApplications.id, applicationId),
            with: { student: true },
        });
        if (!application) {
            throw new HttpError(HttpCode.NOT_FOUND, "Application not found.");
        }
        if (
            !application.student.supervisorEmail ||
            !application.student.supervisorEmail.length
        ) {
            throw new HttpError(
                HttpCode.BAD_REQUEST,
                "Student does not have a supervisor assigned."
            );
        }
        await sendEmail({
            to: application.student.supervisorEmail,
            subject,
            text: body,
        });
        await db.transaction(async (tx) => {
            await tx
                .delete(phdExaminerSuggestions)
                .where(
                    eq(phdExaminerSuggestions.applicationId, application.id)
                );
            await tx
                .delete(phdExaminerAssignments)
                .where(
                    eq(phdExaminerAssignments.applicationId, application.id)
                );
            await createTodos(
                [
                    {
                        assignedTo: application.student.supervisorEmail!,
                        createdBy: req.user!.email,
                        title: `Suggest Examiners for ${application.student.name}`,
                        module: modules[4],
                        completionEvent: `supervisor-suggest-for-${application.id}-exam-${application.examId}`,
                        link: "/phd/supervisor/examiner-suggestions",
                    },
                ],
                tx
            );
        });
        res.status(200).json({ success: true, message: "Notification sent." });
    })
);

export default router;
