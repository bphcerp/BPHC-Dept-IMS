import express from "express";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import { checkAccess } from "@/middleware/auth.ts";
import db from "@/config/db/index.ts";
import { phdSchemas } from "lib";
import { phd } from "@/config/db/schema/admin.ts";
import { eq } from "drizzle-orm";
import { completeTodo } from "@/lib/todos/index.ts";

const router = express.Router();

export default router.post(
    "/",
    checkAccess(),
    asyncHandler(async (req, res) => {
        const { studentEmail, qualificationDate } =
            phdSchemas.setQualificationDateSchema.parse(req.body);

        await db.transaction(async (tx) => {
            await tx
                .update(phd)
                .set({ qualificationDate: new Date(qualificationDate) })
                .where(eq(phd.email, studentEmail));

            await completeTodo(
                {
                    module: "PhD Qe Application",
                    completionEvent: `set_qual_date_${studentEmail}`,
                },
                tx
            );
        });

        res.status(200).json({
            success: true,
            message: "Qualification date set successfully.",
        });
    })
);
