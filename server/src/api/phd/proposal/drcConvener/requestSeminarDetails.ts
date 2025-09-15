import db from "@/config/db/index.ts";
import { HttpError, HttpCode } from "@/config/errors.ts";
import { sendBulkEmails } from "@/lib/common/email.ts";
import { createTodos } from "@/lib/todos/index.ts";
import { checkAccess } from "@/middleware/auth.ts";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import express from "express";
import { modules, phdSchemas } from "lib";
import { inArray } from "drizzle-orm";
import { phdProposals } from "@/config/db/schema/phd.ts";
import assert from "assert";

const router = express.Router();

router.post(
    "/",
    checkAccess(),
    asyncHandler(async (req, res) => {
        assert(req.user, "User must be authenticated");
        const { requests } = phdSchemas.requestSeminarDetailsSchema.parse(
            req.body
        );
        const proposalIds = requests.map((r) => r.proposalId);
        const proposals = await db.query.phdProposals.findMany({
            where: inArray(phdProposals.id, proposalIds),
            with: { student: { columns: { name: true } } },
        });
        const validProposals = proposals.filter(
            (p) => p.status === "dac_accepted"
        );
        if (validProposals.length === 0) {
            throw new HttpError(
                HttpCode.BAD_REQUEST,
                "No valid proposals found in 'DAC Accepted' state."
            );
        }
        const todosToCreate = requests
            .filter((r) => validProposals.some((p) => p.id === r.proposalId))
            .map((r) => {
                const proposal = validProposals.find(
                    (p) => p.id === r.proposalId
                )!;
                return {
                    assignedTo: proposal.supervisorEmail,
                    createdBy: req.user!.email,
                    title: `Set Seminar Details for ${proposal.student.name}'s Proposal`,
                    module: modules[3],
                    completionEvent: `proposal:set-seminar-details:${r.proposalId}`,
                    link: `/phd/supervisor/proposal/${r.proposalId}`,
                    deadline: r.deadline,
                };
            });
        await createTodos(todosToCreate);
        const emailsToSend = requests
            .filter((r) => validProposals.some((p) => p.id === r.proposalId))
            .map((r) => {
                const proposal = validProposals.find(
                    (p) => p.id === r.proposalId
                )!;
                return {
                    to: proposal.supervisorEmail,
                    subject: r.subject,
                    text: r.body,
                };
            });
        await sendBulkEmails(emailsToSend);
        res.status(200).json({
            success: true,
            message: `Notifications sent and To-Dos created for ${validProposals.length} supervisors.`,
        });
    })
);

export default router;
