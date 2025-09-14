import db from "@/config/db/index.ts";
import { HttpError, HttpCode } from "@/config/errors.ts";
import { sendEmail } from "@/lib/common/email.ts";
import { checkAccess } from "@/middleware/auth.ts";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import express from "express";
import { modules, phdSchemas } from "lib";
import { eq } from "drizzle-orm";
import { phdProposals } from "@/config/db/schema/phd.ts";
import assert from "assert";
import { createTodos } from "@/lib/todos/index.ts";

const router = express.Router();

router.post(
    "/",
    checkAccess(),
    asyncHandler(async (req, res) => {
        assert(req.user, "User must be authenticated");
        const { proposalId, subject, body, deadline } =
            phdSchemas.remindSeminarDetailsSchema.parse(req.body);
        const proposal = await db.query.phdProposals.findFirst({
            where: eq(phdProposals.id, proposalId),
            with: { student: { columns: { name: true } } },
        });
        if (!proposal) {
            throw new HttpError(HttpCode.NOT_FOUND, "Proposal not found.");
        }
        if (proposal.status !== "dac_accepted") {
            throw new HttpError(
                HttpCode.BAD_REQUEST,
                "Reminder can only be sent for proposals awaiting seminar details."
            );
        }
        await sendEmail({ to: proposal.supervisorEmail, subject, text: body });
        await createTodos([
            {
                assignedTo: proposal.supervisorEmail,
                createdBy: req.user!.email,
                title: `Reminder: Set Seminar Details for ${proposal.student.name}'s Proposal`,
                module: modules[3],
                completionEvent: `proposal:set-seminar-details:${proposal.id}`,
                link: `/phd/supervisor/proposal/${proposal.id}`,
                deadline: deadline,
            },
        ]);
        res.status(200).json({
            success: true,
            message: "Reminder sent successfully.",
        });
    })
);

export default router;
