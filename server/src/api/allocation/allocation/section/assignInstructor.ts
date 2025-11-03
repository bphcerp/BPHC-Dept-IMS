import db from "@/config/db/index.ts";
import { allocationSectionInstructors } from "@/config/db/schema/allocation.ts";
import { checkAccess } from "@/middleware/auth.ts";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import express from "express";
import { allocationSchemas } from "lib";

const router = express.Router();

router.put(
    "/",
    checkAccess(),
    asyncHandler(async (req, res, _next) => {
        const { sectionId, instructorEmail } =
            allocationSchemas.assignInstructorBodySchema.parse(req.body);

        await db.insert(allocationSectionInstructors).values({
            sectionId,
            instructorEmail,
        });

        res.status(201).send();
    })
);

export default router;
