import express from "express";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import { checkAccess } from "@/middleware/auth.ts";
import db from "@/config/db/index.ts";
import { phdProposals } from "@/config/db/schema/phd.ts";
import { inArray } from "drizzle-orm";
import { HttpCode, HttpError } from "@/config/errors.ts";
import { completeTodo } from "@/lib/todos/index.ts";
import { modules, phdSchemas } from "lib";
const router = express.Router();
export default router.post(
    "/",
    checkAccess(),
    asyncHandler(async (req, res) => {
        const { proposalIds } = phdSchemas.finalizeProposalsSchema.parse(
            req.body
        );
        const result = await db
            .update(phdProposals)
            .set({ status: "completed" })
            .where(inArray(phdProposals.id, proposalIds))
            .returning();
        if (result.length === 0) {
            throw new HttpError(
                HttpCode.NOT_FOUND,
                "No proposals found or already processed."
            );
        }
        await completeTodo({
            module: modules[3],
            completionEvent: proposalIds.map(
                (id) => `proposal:set-seminar-details:${id}`
            ),
            assignedTo: req.user!.email,
        });
        res.status(200).json({
            success: true,
            message: "Proposals finalized.",
        });
    })
);
