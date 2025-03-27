import express from "express";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import { checkAccess } from "@/middleware/auth.ts";
import db from "@/config/db/index.ts";
import { phd } from "@/config/db/schema/admin.ts";
import { eq } from "drizzle-orm";
import { HttpCode, HttpError } from "@/config/errors.ts";
import assert from "assert";

const router = express.Router();

router.get(
  "/",
  checkAccess(),
  asyncHandler(async (req, res) => {
    assert(req.user);

    const { email } = req.user;
    const student = await db.query.phd.findFirst({
      where: eq(phd.email, email),
      columns: {
        numberOfQeApplication: true
      }
    });

    if (!student) {
      throw new HttpError(HttpCode.NOT_FOUND, "Student record not found");
    }

    const nextQeApplicationNumber = (student.numberOfQeApplication ?? 0) + 1;

    if (nextQeApplicationNumber > 3) {
      throw new HttpError(HttpCode.BAD_REQUEST, "Maximum number of qualifying exam attempts reached");
    }

    res.status(HttpCode.OK).json({
      success: true,
      nextQeApplicationNumber
    });
  })
);

export default router;