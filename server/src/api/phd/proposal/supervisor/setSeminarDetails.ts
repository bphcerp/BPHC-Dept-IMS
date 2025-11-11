// server/src/api/phd/proposal/supervisor/setSeminarDetails.ts
import express from "express";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import { checkAccess } from "@/middleware/auth.ts";
import db from "@/config/db/index.ts";
import { phdProposals, phdSeminarSlots } from "@/config/db/schema/phd.ts";
import { phdSchemas, modules } from "lib";
import { eq, and } from "drizzle-orm";
import { HttpError, HttpCode } from "@/config/errors.ts";
import { completeTodo } from "@/lib/todos/index.ts";

const router = express.Router();

export default router.post(
    "/:id",
    checkAccess(),
    asyncHandler(async (req, res) => {
        const proposalId = parseInt(req.params.id);
        if (isNaN(proposalId)) {
            throw new HttpError(HttpCode.BAD_REQUEST, "Invalid Proposal ID");
        }

        const { slotId } = phdSchemas.bookSeminarSlotSchema.parse(req.body);

        await db.transaction(async (tx) => {
            const proposal = await tx.query.phdProposals.findFirst({
                where: and(
                    eq(phdProposals.id, proposalId),
                    eq(phdProposals.supervisorEmail, req.user!.email)
                ),
            });

            if (!proposal) {
                throw new HttpError(
                    HttpCode.NOT_FOUND,
                    "Proposal not found or you are not the supervisor."
                );
            }
            if (
                !["dac_accepted", "seminar_pending"].includes(proposal.status)
            ) {
                throw new HttpError(
                    HttpCode.BAD_REQUEST,
                    "Proposal not in a valid state to set seminar details."
                );
            }

            // Corrected Query: Use full select syntax for row locking
            const [slot] = await tx
                .select()
                .from(phdSeminarSlots)
                .where(eq(phdSeminarSlots.id, slotId))
                .for("update")
                .limit(1);

            if (!slot) {
                throw new HttpError(
                    HttpCode.NOT_FOUND,
                    "Selected seminar slot not found."
                );
            }
            if (slot.isBooked) {
                throw new HttpError(
                    HttpCode.CONFLICT,
                    "This slot has already been booked. Please select another."
                );
            }

            await tx
                .update(phdSeminarSlots)
                .set({
                    isBooked: true,
                    bookedByProposalId: proposalId,
                })
                .where(eq(phdSeminarSlots.id, slotId));

            const timeFormat = new Intl.DateTimeFormat("en-US", {
                hour: "numeric",
                minute: "2-digit",
                hour12: true,
            });
            const seminarTime = `${timeFormat.format(slot.startTime)} - ${timeFormat.format(slot.endTime)}`;

            await tx
                .update(phdProposals)
                .set({
                    seminarDate: slot.startTime,
                    seminarTime: seminarTime,
                    seminarVenue: slot.venue,
                    status: "finalising_documents",
                })
                .where(eq(phdProposals.id, proposalId));

            await completeTodo(
                {
                    module: modules[3],
                    completionEvent: `proposal:set-seminar-details:${proposalId}`,
                },
                tx
            );
        });

        res.status(200).json({
            success: true,
            message: "Seminar slot booked successfully.",
        });
    })
);
