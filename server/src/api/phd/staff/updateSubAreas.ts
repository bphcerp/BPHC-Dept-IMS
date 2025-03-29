import express from "express";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import { checkAccess } from "@/middleware/auth.ts";
import db from "@/config/db/index.ts";
import { phdSubAreas } from "@/config/db/schema/phd.ts";
import { HttpCode, HttpError } from "@/config/errors.ts";
import { phdSchemas } from "lib";

const router = express.Router();

router.post(
    "/",
    checkAccess(),
    asyncHandler(async (req, res, next) => {
        const parsedBody = phdSchemas.updateSubAreasSchema.safeParse(req.body);
        if (!parsedBody.success) {
            return next(new HttpError(HttpCode.BAD_REQUEST, "Invalid subAreas input"));
        }

        const { subAreas } = parsedBody.data;
        const insertData = subAreas.map(({ subarea }) => ({ subarea }));
        await db.insert(phdSubAreas).values(insertData);

        res.status(201).json({ success: true, message: "Sub-areas added successfully" });
    })
);

export default router;