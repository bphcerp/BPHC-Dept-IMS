import express from "express";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import { checkAccess } from "@/middleware/auth.ts";
import db from "@/config/db/index.ts";
import { phd } from "@/config/db/schema/admin.ts";
import { sql } from "drizzle-orm";
import { phdSchemas } from "lib";

const router = express.Router();

router.patch(
    "/",
    checkAccess(),
    asyncHandler(async (req, res) => {
        const validationResult = phdSchemas.updateQualificationDateSchema.safeParse(req.body);
        if (!validationResult.success) {
            res.status(400).json({ success: false, error: validationResult.error.errors });
            return;
        }

        const updates = validationResult.data;
        const updateQueries = [];

        for (const { email, qualificationDate } of updates) {
            const parsedDate = new Date(qualificationDate);
            if (isNaN(parsedDate.getTime())) {
                continue; // Skip invalid dates
            }

            updateQueries.push(
                db
                    .update(phd)
                    .set({ qualificationDate: parsedDate })
                    .where(sql`${phd.email} = ${email}`)
            );
        }

        if (updateQueries.length > 0) {
            await Promise.all(updateQueries);
        }

        res.status(200).json({
            success: true,
            updatedCount: updateQueries.length,
            message: `${updateQueries.length} qualification dates updated successfully.`,
        });
    })
);

export default router;
