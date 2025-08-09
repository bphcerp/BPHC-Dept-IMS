// server/src/api/phd/drc/application-status.ts
import express from "express";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import { checkAccess } from "@/middleware/auth.ts";
import db from "@/config/db/index.ts";
import { phdStudentApplications } from "@/config/db/schema/phd.ts";
import { eq } from "drizzle-orm";
import { HttpError, HttpCode } from "@/config/errors.ts";
import { z } from "zod";

const router = express.Router();

// PATCH /phd/drc/applications/:applicationId/status - Update application status
const updateStatusSchema = z.object({
  status: z.enum(['Rejected']),
  reason: z.string().min(1),
});

router.patch("/:applicationId/status", checkAccess(), asyncHandler(async (req, res, next) => {
  const applicationId = parseInt(req.params.applicationId);
  const parsed = updateStatusSchema.parse(req.body);

  const application = await db.query.phdStudentApplications.findFirst({
    where: eq(phdStudentApplications.id, applicationId),
  });

  if (!application) {
    return next(new HttpError(HttpCode.NOT_FOUND, "Application not found"));
  }

  if (application.status !== 'Applied') {
    return next(new HttpError(HttpCode.BAD_REQUEST, "Can only update applications with 'Applied' status"));
  }

  await db.update(phdStudentApplications)
    .set({
      status: parsed.status,
      rejectionReason: parsed.reason,
      updatedAt: new Date(),
    })
    .where(eq(phdStudentApplications.id, applicationId));

  res.status(200).json({
    success: true,
    message: `Application status updated to ${parsed.status}.`,
  });
}));

export default router;
