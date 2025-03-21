import db from "@/config/db/index.ts";
import { courseHandoutRequests } from "@/config/db/schema/handout.ts";
import { checkAccess } from "@/middleware/auth.ts";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import express from "express";
import { eq } from "drizzle-orm";
import assert from "assert";
const router = express.Router();

router.get(
    "/",
    checkAccess("faculty-get-all-handouts"),
    asyncHandler(async (req, res, _next) => {
        assert(req.user);
        const courses = await db
            .select()
            .from(courseHandoutRequests)
            .where(eq(courseHandoutRequests.icEmail, req.user.email));
        res.status(200).json({
            success: true,
            data: courses,
        });
    })
);

export default router;
