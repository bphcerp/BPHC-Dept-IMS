import db from "@/config/db/index.ts";
import { HttpCode, HttpError } from "@/config/errors.ts";
import { checkAccess } from "@/middleware/auth.ts";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import express from "express";

const router = express.Router();

router.get(
  "/",
  checkAccess(),
  asyncHandler(async (_req, res, next) => {
    const semesterData = await db.query.semester.findFirst({
      orderBy: (semester, { desc, asc }) => [desc(semester.year), asc(semester.oddEven)],
      with:{
        dcaConvenerAtStartOfSem: true,
        hodAtStartOfSem: true,
        form: true
      }
    });

    if (!semesterData) {
      return next(
        new HttpError(HttpCode.NOT_FOUND, "No semesters found in the database")
      );
    }

    res.status(200).json(semesterData);
  })
);

export default router;
