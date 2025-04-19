import express from "express";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import { checkAccess } from "@/middleware/auth.ts";
import { HttpCode } from "@/config/errors.ts";
import db from "@/config/db/index.ts";
import { phd } from "@/config/db/schema/admin.ts";
import { eq } from "drizzle-orm";
import assert from "assert";

const router = express.Router();

router.get(
    "/",
    checkAccess(),
    asyncHandler(async (req, res) => {
        assert(req.user, "User should be defined");
        const supervisorEmail = req.user.email;

        const students = await db.query.phd.findMany({
            where: eq(phd.supervisorEmail, supervisorEmail),
            columns: {
                email: true,
                name: true,
                qualifyingArea1: true,
                qualifyingArea2: true,
            },
        });
        console.log(students);
        res.status(HttpCode.OK).json({ success: true, students });
    })
);

export default router;
