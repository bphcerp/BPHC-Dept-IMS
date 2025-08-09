// server/src/api/phd/supervisor/getStudents.ts
import express from "express";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import { checkAccess } from "@/middleware/auth.ts";
import db from "@/config/db/index.ts";
import { phd } from "@/config/db/schema/admin.ts";
import { eq } from "drizzle-orm";
import assert from "assert";

const router = express.Router();

router.get("/", checkAccess(), asyncHandler(async (req, res) => {
  assert(req.user);
  const supervisorEmail = req.user.email;

  const students = await db.query.phd.findMany({
    where: eq(phd.supervisorEmail, supervisorEmail),
    columns: {
      email: true,
      name: true,
      department: true,
      qualificationDate: true,
    },
  });

  res.status(200).json({
    success: true,
    students,
  });
}));

export default router;
