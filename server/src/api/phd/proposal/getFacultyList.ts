import express from "express";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import { checkAccess } from "@/middleware/auth.ts";
import db from "@/config/db/index.ts";

const router = express.Router();

export default router.get(
    "/",
    checkAccess(),
    asyncHandler(async (_req, res) => {
        const facultyList = await db.query.faculty.findMany({
            columns: {
                email: true,
                name: true,
                department: true,
            },
        });
        res.status(200).json(facultyList);
    })
);
