import db from "@/config/db/index.ts";
import { HttpError, HttpCode } from "@/config/errors.ts";
import { sendBulkEmails } from "@/lib/common/email.ts";
import { createTodos } from "@/lib/todos/index.ts";
import { checkAccess } from "@/middleware/auth.ts";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import express from "express";
import { modules, phdSchemas } from "lib";
import { inArray, eq } from "drizzle-orm";
import { phdProposals, phdEmailTemplates } from "@/config/db/schema/phd.ts";
import assert from "assert";
import Mustache from "mustache";
const router = express.Router();
router.post(
    "/",
    checkAccess(),
    asyncHandler(async (req, res) => {
        assert(req.user, "User must be authenticated");
        const { proposalIds } = phdSchemas.requestSeminarDetailsSchema.parse(
            req.body
        );
        const proposals = await db.query.phdProposals.findMany({
            where: inArray(phdProposals.id, proposalIds),
            with: { student: { columns: { name: true } } },
        });
        const validProposals = proposals.filter(
            (p) => p.status === "seminar_incomplete"
        );
        if (validProposals.length === 0) {
            throw new HttpError(
                HttpCode.BAD_REQUEST,
                "No valid proposals found in 'seminar_incomplete' state."
            );
        }
        const todosToCreate = validProposals.map((p) => ({
            assignedTo: p.supervisorEmail,
            createdBy: req.user!.email,
            title: `Set Seminar Details for ${p.student.name}'s Proposal`,
            module: modules[3],
            completionEvent: `proposal:set-seminar-details:${p.id}`,
            link: `/phd/supervisor/proposal/${p.id}`,
        }));
        await createTodos(todosToCreate);
        const template = await db.query.phdEmailTemplates.findFirst({
            where: eq(phdEmailTemplates.name, "request_seminar_details"),
        });
        if (template) {
            const emailsToSend = validProposals.map((p) => ({
                to: p.supervisorEmail,
                subject: Mustache.render(template.subject, {
                    studentName: p.student.name,
                }),
                html: Mustache.render(template.body, {
                    supervisorName: "Supervisor",
                    studentName: p.student.name,
                    link: `${process.env.FRONTEND_URL}/phd/supervisor/proposal/${p.id}`,
                }),
            }));
            await sendBulkEmails(emailsToSend);
        }
        res.status(200).json({
            success: true,
            message: `To-Dos created for ${validProposals.length}supervisors.`,
        });
    })
);
export default router;
