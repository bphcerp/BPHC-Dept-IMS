// server/src/api/phd/proposal/drcConvener/seminarSlots.ts
import express from "express";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import { checkAccess } from "@/middleware/auth.ts";
import db from "@/config/db/index.ts";
import {
    phdSeminarSlots,
    phdProposals,
    phdProposalSemesters,
} from "@/config/db/schema/phd.ts"; // Added phdProposalSemesters
import { phdSchemas } from "lib";
import {
    desc,
    inArray,
    isNotNull,
    and,
    notInArray,
    eq,
    isNull,
    gte,
    lte,
} from "drizzle-orm"; // Added gte, lte
import assert from "assert";
import { HttpCode, HttpError } from "@/config/errors.ts";
import { z } from "zod"; // Added z

const router = express.Router();

// Schema for the GET query parameter
const getSlotsQuerySchema = z.object({
    proposalSemesterId: z.coerce.number().int().positive().optional(),
});

// GET slots and manually scheduled proposals, filtered by proposalSemesterId
router.get(
    "/",
    checkAccess("phd:drc:proposal"),
    asyncHandler(async (req, res) => {
        const queryParseResult = getSlotsQuerySchema.safeParse(req.query);
        if (!queryParseResult.success) {
            throw new HttpError(
                HttpCode.BAD_REQUEST,
                "Invalid query parameter: " +
                    queryParseResult.error.errors[0]?.message
            );
        }
        const { proposalSemesterId: requestedProposalSemesterId } =
            queryParseResult.data;

        let targetProposalSemesterId: number | undefined =
            requestedProposalSemesterId;
        let semesterStartDate: Date | undefined;
        let semesterEndDate: Date | undefined;

        // Determine the semester dates to filter by
        if (targetProposalSemesterId) {
            const proposalSemester =
                await db.query.phdProposalSemesters.findFirst({
                    where: eq(
                        phdProposalSemesters.id,
                        targetProposalSemesterId
                    ),
                    with: { semester: true },
                });
            if (!proposalSemester) {
                throw new HttpError(
                    HttpCode.NOT_FOUND,
                    "Selected proposal semester not found."
                );
            }
            semesterStartDate = proposalSemester.semester.startDate;
            semesterEndDate = proposalSemester.semester.endDate;
        } else {
            // Fallback: Get the latest proposal semester
            const latestProposalSemester =
                await db.query.phdProposalSemesters.findFirst({
                    orderBy: desc(phdProposalSemesters.id),
                    with: { semester: true },
                });
            if (latestProposalSemester) {
                targetProposalSemesterId = latestProposalSemester.id;
                semesterStartDate = latestProposalSemester.semester.startDate;
                semesterEndDate = latestProposalSemester.semester.endDate;
            } else {
                // No proposal semesters exist at all
                res.status(200).json({
                    bookedSlots: [],
                    manuallyScheduled: [],
                });
                return;
            }
        }

        // Ensure dates are valid Date objects for filtering
        if (!semesterStartDate || !semesterEndDate) {
            throw new HttpError(
                HttpCode.INTERNAL_SERVER_ERROR,
                "Could not determine semester date range."
            );
        }

        // Adjust end date to be inclusive for the whole day
        const inclusiveEndDate = new Date(semesterEndDate);
        inclusiveEndDate.setHours(23, 59, 59, 999);

        // Fetch slots created via the tool within the semester range
        const bookedSlots = await db.query.phdSeminarSlots.findMany({
            where: and(
                gte(phdSeminarSlots.startTime, semesterStartDate),
                lte(phdSeminarSlots.startTime, inclusiveEndDate) // Use inclusive end date
            ),
            orderBy: desc(phdSeminarSlots.startTime),
            with: {
                proposal: {
                    with: {
                        student: {
                            columns: { name: true, email: true },
                        },
                    },
                },
            },
        });

        // Fetch proposals scheduled manually within the semester range
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
                    : undefined,
                // Filter by seminarDate within the semester range
                isNotNull(phdProposals.seminarDate), // Ensure seminarDate exists
                gte(phdProposals.seminarDate, semesterStartDate),
                lte(phdProposals.seminarDate, inclusiveEndDate) // Use inclusive end date
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

// POST Create new slots (no change needed for filtering)
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
        lastDay.setHours(23, 59, 59, 999);

        while (currentDay <= lastDay) {
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
                if (currentSlotEnd > dayEndTime) break;

                slotsToInsert.push({
                    drcConvenerEmail: req.user!.email,
                    venue,
                    startTime: new Date(currentSlotStart),
                    endTime: currentSlotEnd,
                });
                currentSlotStart = currentSlotEnd;
            }
            currentDay.setDate(currentDay.getDate() + 1);
        }

        if (slotsToInsert.length > 0) {
            // Consider adding a check here for conflicts before inserting
            await db
                .insert(phdSeminarSlots)
                .values(slotsToInsert)
                .onConflictDoNothing();
        }

        res.status(201).json({
            success: true,
            message: `${slotsToInsert.length} slots created successfully.`,
        });
    })
);

// DELETE multiple slots (no change needed for filtering)
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
                    isNull(phdSeminarSlots.bookedByProposalId)
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

// PUT Edit a single slot (no change needed for filtering)
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

        const updateData: Partial<typeof phdSeminarSlots.$inferInsert> = {};
        if (body.venue) updateData.venue = body.venue;
        if (body.startTime) updateData.startTime = new Date(body.startTime);
        if (body.endTime) updateData.endTime = new Date(body.endTime);

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
