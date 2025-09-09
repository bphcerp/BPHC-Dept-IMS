import db from "@/config/db/index.ts";
import { phdProposals, phdProposalDacReviews } from "@/config/db/schema/phd.ts";
import { files } from "@/config/db/schema/form.ts";
import { HttpCode, HttpError } from "@/config/errors.ts";
import { checkAccess } from "@/middleware/auth.ts";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import { eq } from "drizzle-orm";
import express from "express";
import { phdSchemas, modules } from "lib";
import { completeTodo } from "@/lib/todos/index.ts";
import { pdfUpload } from "@/config/multer.ts";
import multer from "multer";

const router = express.Router();

router.post(
    "/:id",
    checkAccess(),
    asyncHandler((req, res, next) =>
        pdfUpload.single("suggestionFile")(req, res, (err) => {
            if (err instanceof multer.MulterError) {
                throw new HttpError(HttpCode.BAD_REQUEST, err.message);
            }
            next(err);
        })
    ),
    asyncHandler(async (req, res) => {
        const proposalId = parseInt(req.params.id);
        if (isNaN(proposalId))
            throw new HttpError(HttpCode.BAD_REQUEST, "Invalid proposal ID");

        const { approved, comments } = phdSchemas.submitDacReviewSchema.parse(
            req.body
        );
        const dacMemberEmail = req.user!.email;
        const suggestionFile = req.file;

        await db.transaction(async (tx) => {
            const proposal = await tx.query.phdProposals.findFirst({
                where: (cols, { eq }) => eq(cols.id, proposalId),
                with: { dacMembers: true },
            });

            if (!proposal)
                throw new HttpError(HttpCode.NOT_FOUND, "Proposal not found");
            if (proposal.status !== "dac_review")
                throw new HttpError(
                    HttpCode.BAD_REQUEST,
                    "Proposal is not in DAC review stage"
                );

            const isDacMember = proposal.dacMembers.some(
                (m) => m.dacMemberEmail === dacMemberEmail
            );
            if (!isDacMember)
                throw new HttpError(
                    HttpCode.FORBIDDEN,
                    "You are not assigned to review this proposal."
                );

            let suggestionFileId: number | null = null;
            if (suggestionFile) {
                const [insertedFile] = await tx
                    .insert(files)
                    .values({
                        userEmail: dacMemberEmail,
                        filePath: suggestionFile.path,
                        originalName: suggestionFile.originalname,
                        mimetype: suggestionFile.mimetype,
                        size: suggestionFile.size,
                        fieldName: "suggestionFile",
                        module: modules[3],
                    })
                    .returning();
                suggestionFileId = insertedFile.id;
            }

            await tx
                .insert(phdProposalDacReviews)
                .values({
                    proposalId,
                    dacMemberEmail,
                    approved,
                    comments,
                    suggestionFileId,
                })
                .onConflictDoNothing();

            await completeTodo(
                {
                    module: modules[3],
                    completionEvent: `proposal:dac-review:${proposalId}`,
                    assignedTo: dacMemberEmail,
                },
                tx
            );

            const allReviews = await tx.query.phdProposalDacReviews.findMany({
                where: (cols, { eq }) => eq(cols.proposalId, proposalId),
            });

            if (allReviews.length === proposal.dacMembers.length) {
                const allApproved = allReviews.every(
                    (review) => review.approved
                );
                const newStatus = allApproved ? "completed" : "dac_rejected";
                await tx
                    .update(phdProposals)
                    .set({ status: newStatus })
                    .where(eq(phdProposals.id, proposalId));
            }
        });

        res.status(200).json({ success: true, message: "Review submitted." });
    })
);

export default router;
