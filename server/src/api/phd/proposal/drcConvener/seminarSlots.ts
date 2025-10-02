// server/src/api/phd/proposal/drcConvener/seminarSlots.ts
import express from "express";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import { checkAccess } from "@/middleware/auth.ts";
import db from "@/config/db/index.ts";
import { phdSeminarSlots } from "@/config/db/schema/phd.ts";
import { phdSchemas } from "lib";
import { desc } from "drizzle-orm";
import assert from "assert";

const router = express.Router();

router.get(
    "/",
    checkAccess("phd:drc:seminar-schedule"),
    asyncHandler(async (_req, res) => {
        const slots = await db.query.phdSeminarSlots.findMany({
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
        res.status(200).json(slots);
    })
);

router.post(
    "/",
    checkAccess("phd:drc:seminar-schedule"),
    asyncHandler(async (req, res) => {
        assert(req.user, "User must be authenticated");
        const { slots } = phdSchemas.createSeminarSlotsSchema.parse(req.body);

        // Corrected: Convert string dates to Date objects before insertion
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
