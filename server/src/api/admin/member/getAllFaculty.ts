import db from "@/config/db/index.ts";
import { faculty } from "@/config/db/schema/admin.ts";
import { checkAccess } from "@/middleware/auth.ts";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import express from "express";

const router = express.Router();

router.get(
    "/",
    checkAccess(),
    asyncHandler(async (_req, res) => {
        const facultyData = await db.select().from(faculty);
        res.status(200).json(facultyData);
    })
);

export default router;
