import express from "express";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import { checkAccess } from "@/middleware/auth.ts";
import db from "@/config/db/index.ts";
import { phdProposals, phdSeminarSlots } from "@/config/db/schema/phd.ts";
import { eq, and, isNotNull } from "drizzle-orm";
import { HttpError, HttpCode } from "@/config/errors.ts";
import { createTodos } from "@/lib/todos/index.ts";
import { sendEmail } from "@/lib/common/email.ts";
import { modules } from "lib";
import assert from "assert";
import environment from "@/config/environment.ts";

const router = express.Router();

export default router.post(
    "/:slotId",
    checkAccess("phd:drc:proposal-cancel-seminar"),
    asyncHandler(async (req, res) => {
        assert(req.user, "User must be authenticated");
        const slotId = parseInt(req.params.slotId);
        if (isNaN(slotId)) {
            throw new HttpError(HttpCode.BAD_REQUEST, "Invalid Slot ID");
        }

        const slot = await db.query.phdSeminarSlots.findFirst({
            where: and(
                eq(phdSeminarSlots.id, slotId),
                isNotNull(phdSeminarSlots.bookedByProposalId)
            ),
            with: {
                proposal: {
                    with: {
                        student: { columns: { name: true } },
                    },
                },
            },
        });

        if (!slot) {
            throw new HttpError(
                HttpCode.NOT_FOUND,
                "Booked slot not found or already canceled."
            );
        }

        const proposal = slot.proposal;
        if (!proposal) {
            // Slot is booked, but proposal linked is missing. Clean up the slot.
            await db
                .update(phdSeminarSlots)
                .set({
                    isBooked: false,
                    bookedByProposalId: null,
                })
                .where(eq(phdSeminarSlots.id, slotId));
            throw new HttpError(
                HttpCode.INTERNAL_SERVER_ERROR,
                "Orphaned booking found and cleaned. Please try again if needed."
            );
        }

        await db.transaction(async (tx) => {
            // 1. Unbook the slot
            await tx
                .update(phdSeminarSlots)
                .set({
                    isBooked: false,
                    bookedByProposalId: null,
                })
                .where(eq(phdSeminarSlots.id, slotId));

            // 2. Revert proposal status and clear seminar details
            await tx
                .update(phdProposals)
                .set({
                    status: "seminar_pending",
                    seminarDate: null,
                    seminarTime: null,
                    seminarVenue: null,
                })
                .where(eq(phdProposals.id, proposal.id));

            // 3. Create To-do for supervisor
            await createTodos(
                [
                    {
                        assignedTo: proposal.supervisorEmail,
                        createdBy: req.user!.email,
                        title: `Seminar Canceled: Re-book for ${
                            proposal.student.name ?? "Student"
                        }`,
                        description: `The seminar slot for ${
                            proposal.student.name ?? "Student"
                        } on ${slot.startTime.toLocaleDateString()} was canceled by the DRC Convenor. Please select a new slot.`,
                        module: modules[3],
                        completionEvent: `proposal:set-seminar-details:${proposal.id}`,
                        link: `/phd/supervisor/proposal/${proposal.id}`,
                    },
                ],
                tx
            );
        });

        // 4. Send email to supervisor
        await sendEmail({
            to: proposal.supervisorEmail,
            subject: `Seminar Booking Canceled for ${
                proposal.student.name ?? "Student"
            }`,
            text: `Dear Supervisor,\n\nThe seminar slot scheduled for your student, ${
                proposal.student.name ?? "Student"
            }, on ${slot.startTime.toLocaleDateString()} at ${slot.startTime.toLocaleTimeString()} has been canceled by the DRC Convenor.\n\nPlease log in to the portal to select a new seminar slot for the proposal.\n\nLink: ${
                environment.FRONTEND_URL
            }/phd/supervisor/proposal/${proposal.id}`,
        });

        res.status(200).json({
            success: true,
            message: "Booking canceled successfully.",
        });
    })
);
