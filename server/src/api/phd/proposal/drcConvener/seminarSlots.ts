// server/src/api/phd/proposal/drcConvener/seminarSlots.ts
import express from "express";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import { checkAccess } from "@/middleware/auth.ts";
import db from "@/config/db/index.ts";
import { phdSeminarSlots, phdProposals } from "@/config/db/schema/phd.ts";
import { phdSchemas } from "lib";
import {
    desc,
    inArray,
    isNotNull,
    and,
    notInArray,
    eq,
    isNull,
} from "drizzle-orm";
import assert from "assert";
import { HttpCode, HttpError } from "@/config/errors.ts";

const router = express.Router();

// GET all slots and manually scheduled proposals (existing functionality)
router.get(
    "/",
    checkAccess("phd:drc:proposal"),
    asyncHandler(async (_req, res) => {
        // Fetch slots created via the tool
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

        // Fetch proposals scheduled manually (status finalized, not linked to a booked slot)
        const bookedSlotProposalIds = await db
            .selectDistinct({ id: phdSeminarSlots.bookedByProposalId })
            .from(phdSeminarSlots)
            .where(isNotNull(phdSeminarSlots.bookedByProposalId));

        const bookedIds = bookedSlotProposalIds
            .map((p) => p.id)
            .filter(Boolean) as number[];

        const manuallyScheduled = await db.query.phdProposals.findMany({
            where: and(
                inArray(phdProposals.status, [
                    "finalising_documents",
                    "completed",
                ]),
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

// POST Create new slots based on date range and duration
router.post(
    "/",
    checkAccess("phd:drc:proposal"),
    asyncHandler(async (req, res) => {
        assert(req.user, "User must be authenticated");
        const {
            venue,
            startDate,
            endDate,
            startTime,
            endTime,
            durationMinutes,
        } = phdSchemas.createSeminarSlotsSchema.parse(req.body);

        const slotsToInsert = [];
        let currentDay = new Date(startDate);
        const lastDay = new Date(endDate);
        lastDay.setHours(23, 59, 59, 999); // Ensure end date is inclusive

        while (currentDay <= lastDay) {
            // Skip weekends (Saturday=6, Sunday=0)
            const dayOfWeek = currentDay.getDay();
            if (dayOfWeek === 0 || dayOfWeek === 6) {
                currentDay.setDate(currentDay.getDate() + 1);
                continue;
            }

            const [startHour, startMinute] = startTime.split(":").map(Number);
            const [endHour, endMinute] = endTime.split(":").map(Number);

            let currentSlotStart = new Date(currentDay);
            currentSlotStart.setHours(startHour, startMinute, 0, 0);

            const dayEndTime = new Date(currentDay);
            dayEndTime.setHours(endHour, endMinute, 0, 0);

            while (currentSlotStart < dayEndTime) {
                const currentSlotEnd = new Date(
                    currentSlotStart.getTime() + durationMinutes * 60000
                );
                // Ensure slot doesn't exceed the day's end time
                if (currentSlotEnd > dayEndTime) break;

                slotsToInsert.push({
                    drcConvenerEmail: req.user!.email,
                    venue,
                    startTime: new Date(currentSlotStart), // Ensure it's a new Date object
                    endTime: currentSlotEnd,
                });
                currentSlotStart = currentSlotEnd; // Move to the next slot start time
            }
            currentDay.setDate(currentDay.getDate() + 1); // Move to the next day
        }

        if (slotsToInsert.length > 0) {
            await db
                .insert(phdSeminarSlots)
                .values(slotsToInsert)
                .onConflictDoNothing(); // Avoid inserting duplicates if run again
        }

        res.status(201).json({
            success: true,
            message: `${slotsToInsert.length} slots created successfully.`,
        });
    })
);

// DELETE multiple slots
router.delete(
    "/",
    checkAccess("phd:drc:proposal"),
    asyncHandler(async (req, res) => {
        const { slotIds } = phdSchemas.deleteSeminarSlotsSchema.parse(req.body);

        const result = await db
            .delete(phdSeminarSlots)
            .where(
                and(
                    inArray(phdSeminarSlots.id, slotIds),
                    isNull(phdSeminarSlots.bookedByProposalId) // Only delete unbooked slots
                )
            )
            .returning({ id: phdSeminarSlots.id });

        if (result.length !== slotIds.length) {
            const bookedCount = slotIds.length - result.length;
            throw new HttpError(
                HttpCode.BAD_REQUEST,
                `Could not delete ${bookedCount} slot(s) because they are already booked. ${result.length} unbooked slots deleted.`
            );
        }

        res.status(200).json({
            success: true,
            message: `${result.length} slots deleted successfully.`,
        });
    })
);

// PUT Edit a single slot
router.put(
    "/:slotId",
    checkAccess("phd:drc:proposal"),
    asyncHandler(async (req, res) => {
        const { slotId } = phdSchemas.editSeminarSlotPathSchema.parse(
            req.params
        );
        const body = phdSchemas.editSeminarSlotBodySchema.parse(req.body);

        const slot = await db.query.phdSeminarSlots.findFirst({
            where: eq(phdSeminarSlots.id, slotId),
        });

        if (!slot) {
            throw new HttpError(HttpCode.NOT_FOUND, "Slot not found.");
        }
        if (slot.isBooked) {
            throw new HttpError(
                HttpCode.BAD_REQUEST,
                "Cannot edit a booked slot."
            );
        }

        // Prepare update data, converting dates if necessary
        const updateData: Partial<typeof phdSeminarSlots.$inferInsert> = {};
        if (body.venue) updateData.venue = body.venue;
        if (body.startTime) updateData.startTime = new Date(body.startTime);
        if (body.endTime) updateData.endTime = new Date(body.endTime);

        // Ensure endTime > startTime if both are updated
        const finalStartTime = updateData.startTime ?? slot.startTime;
        const finalEndTime = updateData.endTime ?? slot.endTime;
        if (finalEndTime <= finalStartTime) {
            throw new HttpError(
                HttpCode.BAD_REQUEST,
                "End time must be after start time."
            );
        }

        const [updatedSlot] = await db
            .update(phdSeminarSlots)
            .set(updateData)
            .where(eq(phdSeminarSlots.id, slotId))
            .returning();

        res.status(200).json({
            success: true,
            message: "Slot updated successfully.",
            slot: updatedSlot,
        });
    })
);

export default router;
