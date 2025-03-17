import express from "express";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import { checkAccess } from "@/middleware/auth.ts";
import db from "@/config/db/index.ts";
import { phd } from "@/config/db/schema/admin.ts";
import { eq } from "drizzle-orm";
import assert from "assert";

const router = express.Router();

export default router.get(
    "/",
    checkAccess("phd-view-qualifying-exam-status"),
    asyncHandler(async (req, res) => {
        assert(req.user);

        const student = await db
            .select({
                email: phd.email,
                qualifyingExam1: phd.qualifyingExam1,
                qualifyingExam2: phd.qualifyingExam2,
            })
            .from(phd)
            .where(eq(phd.email, req.user.email))
            .limit(1);

        if (student.length === 0) {
            res.status(404).json({ success: false, message: "Student not found" });
            return;
        }

        const passed = student[0].qualifyingExam1 || student[0].qualifyingExam2;
        res.status(200).json({ success: true, status: passed ? "pass" : "fail" });
    })
);
