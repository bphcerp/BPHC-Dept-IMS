import express from "express";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import { checkAccess } from "@/middleware/auth.ts";
import db from "@/config/db/index.ts";
import { faculty } from "@/config/db/schema/admin.ts";

const router = express.Router();

router.get(
    "/",
    checkAccess(),
    asyncHandler(async (_req, res) => {
        const facultyList = await db
            .select({
                email: faculty.email,
                name: faculty.name,
            })
            .from(faculty);

        res.json({ success: true, faculty: facultyList });
    })
);

export default router;
