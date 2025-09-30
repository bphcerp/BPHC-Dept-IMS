import db from "@/config/db/index.ts";
import { allocationSectionInstructors } from "@/config/db/schema/allocation.ts";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import { and, eq } from "drizzle-orm";
import express from "express";
import { allocationSchemas } from "lib";

const router = express.Router();

router.delete(
    "/",
    asyncHandler(async (req, res, _next) => {
        const { sectionId, instructorEmail } =
            allocationSchemas.dismissInstructorBodySchema.parse(req.body);

        await db
            .delete(allocationSectionInstructors)
            .where(
                and(
                    eq(allocationSectionInstructors.sectionId, sectionId),
                    eq(
                        allocationSectionInstructors.instructorEmail,
                        instructorEmail
                    )
                )
            );

        res.status(204).send();
    })
);

export default router;
