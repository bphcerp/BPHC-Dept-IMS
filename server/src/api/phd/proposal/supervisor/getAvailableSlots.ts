import express from "express";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import { checkAccess } from "@/middleware/auth.ts";
import db from "@/config/db/index.ts";
import { phdSeminarSlots } from "@/config/db/schema/phd.ts";
import { eq, desc } from "drizzle-orm";
import { todoExists } from "@/lib/todos/index.ts";
import { modules } from "lib";

const router = express.Router();

router.get(
    "/",
    checkAccess(),
    asyncHandler(async (req, res) => {
        const supervisorEmail = req.user!.email;

        const supervisedProposals = await db.query.phdProposals.findMany({
            where: (cols, { eq, and, inArray }) =>
                and(
                    eq(cols.supervisorEmail, supervisorEmail),
                    inArray(cols.status, ["dac_accepted", "seminar_pending"])
                ),
            columns: { id: true },
        });

        if (supervisedProposals.length === 0) {
            res.status(200).json([]);
        }

        const todosToCheck = supervisedProposals.map((p) => ({
            module: modules[3],
            completionEvent: `proposal:set-seminar-details:${p.id}`,
            assignedTo: supervisorEmail,
        }));

        const existingTodos = await todoExists(todosToCheck);

        if (!existingTodos.some((exists) => exists)) {
            res.status(200).json([]);
        }

        const availableSlots = await db.query.phdSeminarSlots.findMany({
            where: eq(phdSeminarSlots.isBooked, false),
            orderBy: desc(phdSeminarSlots.startTime),
        });
        res.status(200).json(availableSlots);
    })
);

export default router;
