import express from "express";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import { checkAccess } from "@/middleware/auth.ts";
import db from "@/config/db/index.ts";
import { phdSeminarSlots, phdProposals } from "@/config/db/schema/phd.ts";
import { phdSchemas } from "lib";
import { desc, inArray, isNotNull, and, notInArray } from "drizzle-orm"; // Import notInArray and isNotNull
import assert from "assert";

const router = express.Router();

router.get(
    "/",
    checkAccess("phd:drc:proposal"),
    asyncHandler(async (_req, res) => {
        // 1. Get slots booked via the system
        const bookedSlots = await db.query.phdSeminarSlots.findMany({
            orderBy: desc(phdSeminarSlots.startTime),
            with: {
                proposal: {
                    with: {
                        student: {
                            columns: {
                                name: true,
                                email: true,
                            },
                        },
                    },
                },
            },
        });

        // 2. Get proposals scheduled manually

        // First, find all proposal IDs that *are* associated with a slot
        const bookedSlotProposalIds = await db
            .selectDistinct({ id: phdSeminarSlots.bookedByProposalId })
            .from(phdSeminarSlots)
            .where(isNotNull(phdSeminarSlots.bookedByProposalId));

        const bookedIds = bookedSlotProposalIds
            .map((p) => p.id)
            .filter(Boolean) as number[];

        // Now, find proposals in the finalising/completed state that are NOT in the bookedIds list
        const manuallyScheduled = await db.query.phdProposals.findMany({
            where: and(
                inArray(phdProposals.status, [
                    "finalising_documents",
                    "completed",
                ]),
                // Only apply notInArray if there are any booked IDs to filter against
                bookedIds.length > 0
                    ? notInArray(phdProposals.id, bookedIds)
                    : undefined
            ),
            with: {
                student: { columns: { name: true, email: true } },
                supervisor: { columns: { name: true, email: true } },
            },
            columns: {
                id: true,
                seminarDate: true,
                seminarTime: true,
                seminarVenue: true,
            },
            orderBy: desc(phdProposals.seminarDate),
        });

        res.status(200).json({ bookedSlots, manuallyScheduled });
    })
);

router.post(
    "/",
    checkAccess("phd:drc:proposal"),
    asyncHandler(async (req, res) => {
        assert(req.user, "User must be authenticated");
        const { slots } = phdSchemas.createSeminarSlotsSchema.parse(req.body);

        const slotsToInsert = slots.map((slot) => ({
            drcConvenerEmail: req.user!.email,
            venue: slot.venue,
            startTime: new Date(slot.startTime),
            endTime: new Date(slot.endTime),
        }));

        if (slotsToInsert.length > 0) {
            await db.insert(phdSeminarSlots).values(slotsToInsert);
        }
        res.status(201).json({
            success: true,
            message: `${slots.length} slots created successfully.`,
        });
    })
);

export default router;
