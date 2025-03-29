import express from "express";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import { checkAccess } from "@/middleware/auth.ts";
import { HttpError, HttpCode } from "@/config/errors.ts";
import db from "@/config/db/index.ts";
import { phd } from "@/config/db/schema/admin.ts";
import { eq } from "drizzle-orm";
import { phdSchemas } from "lib";

const router = express.Router();

router.post(
    "/",
    checkAccess(),
    asyncHandler(async (req, res, next) => {
        const validationResult = phdSchemas.updateQualificationDateSchema.parse(
            req.body
        );
        const updates = validationResult;
        const updatedStudents = [];

        for (const { email, qualificationDate } of updates) {
            if (!qualificationDate) continue;

            const parsedDate = new Date(qualificationDate);
            if (isNaN(parsedDate.getTime())) continue;

            const studentRecord = await db.query.phd.findFirst({
                where: eq(phd.email, email),
            });

            if (!studentRecord) continue;

            await db
                .update(phd)
                .set({ qualificationDate: parsedDate })
                .where(eq(phd.email, email));

            updatedStudents.push({ email, qualificationDate: parsedDate });
        }

        if (updatedStudents.length === 0) {
            return next(
                new HttpError(
                    HttpCode.BAD_REQUEST,
                    "No valid qualification dates to update"
                )
            );
        }

        res.status(200).json({
            success: true,
            updatedCount: updatedStudents.length,
            updatedStudents,
            message: `${updatedStudents.length} qualification dates updated successfully.`,
        });
    })
);

export default router;
