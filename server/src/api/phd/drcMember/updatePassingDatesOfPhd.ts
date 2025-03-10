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
    checkAccess("drc-update-qualification-date"),
    asyncHandler(async (req, res) => {
        const validationResult = phdSchemas.updateQualificationDateSchema.safeParse(req.body);
        if (!validationResult.success) {
            res.status(400).json({ success: false, error: validationResult.error.errors });
            return;
        }

        const updates: Record<string, string> = req.body; 

        for (const [email, dateString] of Object.entries(updates)) {
            const parsedDate = new Date(dateString);

            if (isNaN(parsedDate.getTime())) {
                res.status(400).json({ success: false, error: `Invalid date format for ${email}` });
                return;
            }

            await db
                .update(phd)
                .set({ qualificationDate: parsedDate })
                .where(sql`${phd.email} = ${email}`);
        }

        res.status(200).json({ success: true, message: "Qualification dates updated successfully" });
    })
);


export default router;
