import express from "express";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import { checkAccess } from "@/middleware/auth.ts";
import db from "@/config/db/index.ts";
import { phdProposals } from "@/config/db/schema/phd.ts";
import { eq } from "drizzle-orm";
import z from "zod";
import { HttpCode, HttpError } from "@/config/errors.ts";
import { completeTodo } from "@/lib/todos/index.ts";
import { modules } from "lib";

const router = express.Router();
const finalizeProposalsSchema = z.object({
    proposalId: z.number().int().positive(),
});
export default router.post(
    "/",
    checkAccess(),
    asyncHandler(async (req, res) => {
        const { proposalId } = finalizeProposalsSchema.parse(req.body);
        const result = await db
            .update(phdProposals)
            .set({ status: "completed" })
            .where(eq(phdProposals.id, proposalId))
            .returning();
        if (result.length === 0) {
            throw new HttpError(
                HttpCode.NOT_FOUND,
                "Proposal not found or already processed."
            );
        }
        await completeTodo({
            module: modules[3],
            completionEvent: `proposal:set-seminar-details:${proposalId}`,
            assignedTo: req.user!.email,
        });
        res.status(200).json({
            success: true,
            message: "Proposals finalized.",
        });
    })
);
