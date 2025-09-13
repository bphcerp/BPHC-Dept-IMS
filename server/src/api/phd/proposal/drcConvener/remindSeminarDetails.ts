import db from "@/config/db/index.ts";
import { HttpError, HttpCode } from "@/config/errors.ts";
import { sendEmail } from "@/lib/common/email.ts";
import { checkAccess } from "@/middleware/auth.ts";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import express from "express";
import {  phdSchemas } from "lib";
import { eq } from "drizzle-orm";
import { phdProposals, phdEmailTemplates } from "@/config/db/schema/phd.ts";
import assert from "assert";
import Mustache from "mustache";
const router = express.Router();
router.post(
    "/",
    checkAccess(),
    asyncHandler(async (req, res) => {
        assert(req.user, "User must be authenticated");
        const { proposalId } = phdSchemas.remindSeminarDetailsSchema.parse(
            req.body
        );
        const proposal = await db.query.phdProposals.findFirst({
            where: eq(phdProposals.id, proposalId),
            with: { student: { columns: { name: true } } },
        });
        if (!proposal) {
            throw new HttpError(HttpCode.NOT_FOUND, "Proposal not found.");
        }
        if (proposal.status !== "seminar_incomplete") {
            throw new HttpError(
                HttpCode.BAD_REQUEST,
                "Reminder can only be sent for proposals awaiting seminar details."
            );
        }
        const template = await db.query.phdEmailTemplates.findFirst({
            where: eq(phdEmailTemplates.name, "reminder_seminar_details"),
        });
        if (template) {
            await sendEmail({
                to: proposal.supervisorEmail,
                subject: Mustache.render(template.subject, {
                    studentName: proposal.student.name,
                }),
                html: Mustache.render(template.body, {
                    supervisorName: "Supervisor",
                    studentName: proposal.student.name,
                    link: `${process.env.FRONTEND_URL}/phd/supervisor/proposal/${proposal.id}`,
                }),
            });
        }
        res.status(200).json({
            success: true,
            message: "Reminder sent successfully.",
        });
    })
);
export default router;
