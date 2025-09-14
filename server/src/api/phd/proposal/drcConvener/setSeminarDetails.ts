import express from "express";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import { checkAccess } from "@/middleware/auth.ts";
import db from "@/config/db/index.ts";
import { phdProposals } from "@/config/db/schema/phd.ts";
import { phdSchemas } from "lib";
import { eq, and } from "drizzle-orm";
import { HttpError, HttpCode } from "@/config/errors.ts";

const router = express.Router();
export default router.post(
    "/:id",
    checkAccess(),
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
                status: "finalising",
            })
            .where(
                and(
                    eq(phdProposals.id, proposalId),
                    eq(phdProposals.status, "dac_accepted")
                )
            )
            .returning();
        if (result.length === 0) {
            throw new HttpError(
                HttpCode.BAD_REQUEST,
                "Proposal not found or not in a valid state to set seminar details."
            );
        }
        res.status(200).json({
            success: true,
            message: "Seminar details saved.",
        });
    })
);
