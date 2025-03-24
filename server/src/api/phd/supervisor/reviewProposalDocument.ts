import express from "express";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import { checkAccess } from "@/middleware/auth.ts";
import db from "@/config/db/index.ts";
import { fileFieldStatus } from "@/config/db/schema/form.ts";
import { eq } from "drizzle-orm";
import { HttpCode, HttpError } from "@/config/errors.ts";
import { z } from "zod";

const reviewSchema = z.object({
  comments: z.string(),
  status: z.enum(["approved", "rejected"]),
});

const router = express.Router();

router.post(
  "/:fieldId",
  checkAccess(),
  asyncHandler(async (req, res, next) => {
    const fieldId = parseInt(req.params.fieldId);
    if (isNaN(fieldId)) {
      return next(new HttpError(HttpCode.BAD_REQUEST, "Invalid field ID"));
    }

    const { comments, status } = reviewSchema.parse(req.body);

    // Convert "approved" to true and "rejected" to false
    const statusBoolean = status === "approved";

    // Get the current user's role
    const user = await db.query.users.findFirst({
      where: (user) => eq(user.email, req.user!.email),
    });

    if (!user) {
      return next(new HttpError(HttpCode.NOT_FOUND, "User not found"));
    }

    const topRole = await db.query.roles.findFirst({
      where: (role) => eq(role.id, user.roles[0]),
    });

    // Get file field to verify ownership
    const fileField = await db.query.fileFields.findFirst({
      where: (field) => eq(field.id, fieldId),
      with: {
        file: true,
      },
    });

    if (!fileField) {
      return next(new HttpError(HttpCode.NOT_FOUND, "Document not found"));
    }

    // Check if the supervisor is allowed to review this document
    const student = await db.query.phd.findFirst({
      where: (student) => eq(student.email, fileField.userEmail),
    });

    if (!student) {
      return next(new HttpError(HttpCode.NOT_FOUND, "Student not found"));
    }

    const canReview =
      student.supervisorEmail === req.user!.email ||
      student.coSupervisorEmail === req.user!.email ||
      student.coSupervisorEmail2 === req.user!.email;

    if (!canReview) {
      return next(new HttpError(HttpCode.FORBIDDEN, "You are not authorized to review this document"));
    }

    // Insert review
    await db.insert(fileFieldStatus).values({
      comments,
      status: statusBoolean, // Ensure status is boolean
      updatedAs: topRole ? topRole.roleName : "Supervisor",
      fileField: fieldId,
      userEmail: req.user!.email,
    });

    res.status(200).json({
      success: true,
      message: `Document ${status === "approved" ? "approved" : "rejected"}`,
    });
  })
);

export default router;
