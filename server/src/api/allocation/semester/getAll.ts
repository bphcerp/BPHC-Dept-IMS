import db from "@/config/db/index.ts";
import { checkAccess } from "@/middleware/auth.ts";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import express from "express";

const router = express.Router();

router.get(
  "/",
  checkAccess(),
  asyncHandler(async (_req, res) => {
    const semesters = await db.query.semester.findMany({
      with: {
        dcaConvenerAtStartOfSem: true,
        hodAtStartOfSem: true
      },
      orderBy: (semester, { desc }) => [desc(semester.year), desc(semester.semesterType)], 
    });
    res.status(200).json(semesters);
  })
);

export default router;
