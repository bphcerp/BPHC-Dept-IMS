// server/src/api/phd/proposal/drcConvener/reenableProposal.ts
import express from "express";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import { checkAccess } from "@/middleware/auth.ts";
import db from "@/config/db/index.ts";
import { phdProposals } from "@/config/db/schema/phd.ts";
import { phdSchemas } from "lib"; // Added modules
import { eq } from "drizzle-orm";
import { HttpCode, HttpError } from "@/config/errors.ts";
import { sendEmail } from "@/lib/common/email.ts";
import assert from "assert";

const router = express.Router();

router.post(
    "/:id",
    checkAccess("phd:drc:proposal"), // Ensure only DRC convenor can do this
    asyncHandler(async (req, res) => {
        assert(req.user, "User must be authenticated");
        const proposalId = parseInt(req.params.id);
        if (isNaN(proposalId)) {
            throw new HttpError(HttpCode.BAD_REQUEST, "Invalid Proposal ID");
        }

        // No body needed for re-enable, schema is empty
        phdSchemas.drcProposalReenableSchema.parse(req.body);

        const proposal = await db.query.phdProposals.findFirst({
            where: eq(phdProposals.id, proposalId),
            with: { student: true },
        });

        if (!proposal) {
            throw new HttpError(HttpCode.NOT_FOUND, "Proposal not found.");
        }

        if (proposal.status !== "rejected") {
            throw new HttpError(
                HttpCode.BAD_REQUEST,
                "Proposal is not in a 'rejected' state."
            );
        }

        // Revert state to 'draft' so student can modify/resubmit
        const newState = "draft";

        await db
            .update(phdProposals)
            .set({
                status: newState,
                comments: "Re-enabled by DRC Convenor for student edits.",
            }) // Update comments for clarity
            .where(eq(phdProposals.id, proposalId));

        // Notify student and supervisor
        await sendEmail({
            to: proposal.student.email,
            subject: "PhD Proposal Re-enabled for Editing",
            html: `<p>Dear ${proposal.student.name ?? "Student"},</p><p>Your PhD proposal titled "${proposal.title}" has been re-enabled by the DRC Convenor.</p><p>It has been returned to the 'Draft' stage. Please make any necessary changes and resubmit it for supervisor review via the portal.</p>`,
        });

        await sendEmail({
            to: proposal.supervisorEmail,
            subject: `PhD Proposal Re-enabled for ${proposal.student.name}`,
            html: `<p>Dear Supervisor,</p><p>The PhD proposal titled "${proposal.title}" submitted by your student, <strong>${proposal.student.name}</strong>, which was previously rejected, has been re-enabled by the DRC Convenor.</p><p>It has been returned to the 'Draft' stage for the student to edit and resubmit. You will be notified when it is ready for your review again.</p>`,
        });

        res.status(200).json({
            success: true,
            message: `Proposal ${proposalId} has been re-enabled and set to '${newState}'. Student notified to resubmit.`,
        });
    })
);

export default router;
