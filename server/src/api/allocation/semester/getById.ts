import db from "@/config/db/index.ts";
import { HttpCode, HttpError } from "@/config/errors.ts";
import { checkAccess } from "@/middleware/auth.ts";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import express from "express";

const router = express.Router();

router.get(
  "/:id",
  checkAccess('allocation:semester:read'),
  asyncHandler(async (req, res, next) => {
    const { id } = req.params;

    const semesterData = await db.query.semester.findFirst({
      where: (c, { eq }) => eq(c.id, id),
    });

    if (!semesterData) {
      return next(
        new HttpError(HttpCode.NOT_FOUND, "Semester not found for given ID")
      );
    }

    res.status(200).json(semesterData);
  })
);

export default router;
