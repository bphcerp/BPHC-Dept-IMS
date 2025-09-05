import express from "express";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import { checkAccess } from "@/middleware/auth.ts";
import db from "@/config/db/index.ts";
import { faculty } from "@/config/db/schema/admin.ts";

const router = express.Router();

export default router.get(
    "/",
    checkAccess(),
    asyncHandler(async (_req, res) => {
        const facultyList = await db
            .select({
                name: faculty.name,
                email: faculty.email,
            })
            .from(faculty);

        res.status(200).json(facultyList);
    })
);
