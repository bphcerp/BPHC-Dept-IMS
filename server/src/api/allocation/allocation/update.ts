import db from "@/config/db/index.ts";
import { allocation } from "@/config/db/schema/allocation.ts";
import { HttpCode, HttpError } from "@/config/errors.ts";
import { checkAccess } from "@/middleware/auth.ts";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import express from "express";
import { z } from "zod";
import { eq } from "drizzle-orm";
import {updateAllocationSchema} from "node_modules/lib/src/schemas/Allocation.ts";

const router = express.Router();



router.put(
  "/",
  checkAccess(),
  asyncHandler(async (req, res, next) => {
    const parsed = updateAllocationSchema.parse(req.body);

 
    const allocationExists = await db.query.allocation.findFirst({
      where: (alloc, { eq }) => eq(alloc.id, parsed.id),
    });

    if (!allocationExists) {
      return next(
        new HttpError(HttpCode.NOT_FOUND, "Allocation not found for given ID")
      );
    }

  
    const { id, ...updates } = parsed;

    if (Object.keys(updates).length === 0) {
      return next(
        new HttpError(HttpCode.BAD_REQUEST, "No fields provided to update")
      );
    }

    const updated = await db
      .update(allocation)
      .set({
        ...updates,
        updatedOn: new Date(),
      })
      .where(eq(allocation.id, id))
      .returning();

    res.status(200).json(updated);
  })
);

export default router;
