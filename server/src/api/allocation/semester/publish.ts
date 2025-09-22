import express from "express";
import db from "@/config/db/index.ts";
import { checkAccess } from "@/middleware/auth.ts";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import { allocationForm } from "@/config/db/schema/allocationFormBuilder.ts";
import { allocationFormPublishSchema } from "node_modules/lib/src/schemas/AllocationFormBuilder.ts";
import { eq } from "drizzle-orm";
import { semester } from "@/config/db/schema/allocation.ts";
const router = express.Router();

router.post(
    "/:id",
    checkAccess("allocation:form:publish"),
    asyncHandler(async (req, res) => {
        const { id } = req.params;
        const { allocationDeadline } = allocationFormPublishSchema.parse(
            req.body
        );

        await db.transaction(async (tx) => {
            const semesterUpdated = await tx
                .update(semester)
                .set({ allocationStatus: "ongoing" })
                .where(eq(semester.id, id))
                .returning();

            await tx
                .update(allocationForm)
                .set({ publishedDate: new Date(), allocationDeadline })
                .where(eq(allocationForm.id, semesterUpdated[0].formId!));
        });

        //TODO: send notifications/emails to all the faculty, add a todo item? (have to see how to do this)

        res.send("Form published successfully");
    })
);

export default router;
