import express from "express";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import { checkAccess } from "@/middleware/auth.ts";
import db from "@/config/db/index.ts";
import { phd } from "@/config/db/schema/admin.ts";

const router = express.Router();

export default router.get(
  "/",
  checkAccess(),
  asyncHandler(async (_req, res) => {
    const examStatuses = await db.select({
      email: phd.email,
      qualifyingExam1: phd.qualifyingExam1,
      qualifyingExam2: phd.qualifyingExam2,
      qualifyingExam1Date: phd.qualifyingExam1Date,
      qualifyingExam2Date: phd.qualifyingExam2Date,
    }).from(phd);
    
    res.json({
      success: true,
      examStatuses
    });
  })
);