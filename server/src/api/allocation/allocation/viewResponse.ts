import db from "@/config/db/index.ts";
import { HttpCode, HttpError } from "@/config/errors.ts";
import { checkAccess } from "@/middleware/auth.ts";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import express from "express";
import { eq } from "drizzle-orm";

const router = express.Router();

router.get(
  "/:responseId",
  checkAccess(),
  asyncHandler(async (req, res, next) => {
    const responseId = req.params.responseId;

    const formResponseWithDetails = await db.query.allocationFormResponse.findFirst({
      where: (fr, { eq }) => eq(fr.id, responseId),
      with: {
        values: {
          with: {
            answers: {
              with: {
                option: true,
              },
            },
            field: true,
          },
        },
        submittedBy: true,
        form: true,
      },
    });

    if (!formResponseWithDetails) {
      return next(
        new HttpError(HttpCode.NOT_FOUND, "Allocation form response not found")
      );
    }

    res.status(200).json(formResponseWithDetails);
  })
);

export default router;
