import express from "express";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import { checkAccess } from "@/middleware/auth.ts";
import { HttpError, HttpCode } from "@/config/errors.ts";
import db from "@/config/db/index.ts";
import { phdSemesters } from "@/config/db/schema/phd.ts";
import { eq } from "drizzle-orm";

const router = express.Router();

export default  router.get(
    "/:id",
    checkAccess(),
    asyncHandler(async (req, res, next) => {
      const { id } = req.params;
      
      const semester = await db
        .select()
        .from(phdSemesters)
        .where(eq(phdSemesters.id, parseInt(id)))
        .limit(1);
      
      if (semester.length === 0) {
        return next(new HttpError(HttpCode.NOT_FOUND, "Semester not found"));
      }
      
      res.status(200).json({ success: true, semester: semester[0] });
    })
  );