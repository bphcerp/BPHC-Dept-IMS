import express from "express";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import { checkAccess } from "@/middleware/auth.ts";
import db from "@/config/db/index.ts";
import { phdProposals } from "@/config/db/schema/phd.ts";
import { phdSchemas, modules } from "lib";
import { eq, and, inArray } from "drizzle-orm";
import { HttpError, HttpCode } from "@/config/errors.ts";
import { completeTodo } from "@/lib/todos/index.ts";

const router = express.Router();

export default router.post(
    "/:id",
    checkAccess(), // Permission will be added in permissions.ts
    asyncHandler(async (req, res) => {
        const proposalId = parseInt(req.params.id);
        if (isNaN(proposalId)) {
            throw new HttpError(HttpCode.BAD_REQUEST, "Invalid Proposal ID");
        }
        const body = phdSchemas.setSeminarDetailsSchema.parse(req.body);

        const result = await db
            .update(phdProposals)
            .set({
                seminarDate: new Date(body.seminarDate),
                seminarTime: body.seminarTime,
                seminarVenue: body.seminarVenue,
                status: "finalising_documents",
            })
            .where(
                and(
                    eq(phdProposals.id, proposalId),
                    eq(phdProposals.supervisorEmail, req.user!.email),
                    inArray(phdProposals.status, [
                        "dac_accepted",
                        "seminar_pending",
                    ])
                )
            )
            .returning();

        if (result.length === 0) {
            throw new HttpError(
                HttpCode.BAD_REQUEST,
                "Proposal not found, you are not the supervisor, or it is not in a valid state to set seminar details."
            );
        }

        // Complete the To-Do for the supervisor
        await completeTodo({
            module: modules[3],
            completionEvent: `proposal:set-seminar-details:${proposalId}`,
            assignedTo: req.user!.email,
        });

        res.status(200).json({
            success: true,
            message: "Seminar details saved successfully.",
        });
    })
);
