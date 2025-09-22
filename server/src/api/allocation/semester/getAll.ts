import db from "@/config/db/index.ts";
import { semester } from "@/config/db/schema/allocation.ts";
import { checkAccess } from "@/middleware/auth.ts";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import { desc } from "drizzle-orm";
import express from "express";

const router = express.Router();

router.get(
  "/",
  checkAccess(),
  asyncHandler(async (_req, res) => {
    const semesters = await db.select().from(semester).orderBy(desc(semester.year), desc(semester.semesterType));
    res.status(200).json(semesters);
  })
);

export default router;
