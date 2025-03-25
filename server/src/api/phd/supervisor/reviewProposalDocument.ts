import express from "express";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import { checkAccess } from "@/middleware/auth.ts";
import db from "@/config/db/index.ts";
import {
  applications,
  textFields,
  applicationStatus
} from "@/config/db/schema/form.ts";
import { eq, and } from "drizzle-orm";
import { HttpCode, HttpError } from "@/config/errors.ts";
import { z } from "zod";
import { modules } from "lib";

const reviewSchema = z.object({
  status: z.enum(["approved", "rejected"]),
  comments: z.string().optional(),
  studentEmail: z.string().email(),
});

const router = express.Router();

router.post(
  "/",
  checkAccess(),
  asyncHandler(async (req, res) => {
    const user = req.user;
    if (!user) {
      throw new HttpError(HttpCode.UNAUTHORIZED, "User not authenticated");
    }

    const { status, comments, studentEmail } = reviewSchema.parse(req.body);

    // Find the PhD record to verify supervisor relationship
    const phdRecord = await db.query.phd.findFirst({
      where: (phdTable, { eq }) => eq(phdTable.email, studentEmail)
    });

    if (!phdRecord) {
      throw new HttpError(HttpCode.NOT_FOUND, "No PhD student found");
    }

    // Check if the current user is the primary or co-supervisor
    const isPrimaryOrCoSupervisor =
      phdRecord.supervisorEmail === user.email ||
      phdRecord.coSupervisorEmail === user.email ||
      phdRecord.coSupervisorEmail2 === user.email;

    if (!isPrimaryOrCoSupervisor) {
      throw new HttpError(HttpCode.FORBIDDEN, "Not authorized to review this application");
    }

    // Find the student's application
    const studentApplication = await db
      .select()
      .from(applications)
      .where(
        and(
          eq(applications.userEmail, studentEmail),
          eq(applications.module, modules[3]) // PhD module
        )
      )
      .limit(1);

    if (!studentApplication.length) {
      throw new HttpError(HttpCode.NOT_FOUND, "No application found for the student");
    }

    // Perform transaction to update application status and add review details
    await db.transaction(async (tx) => {
      // Update application status
      await tx
        .update(applications)
        .set({
          status: status === "approved" ? "approved" : "rejected"
        })
        .where(
          and(
            eq(applications.userEmail, studentEmail),
            eq(applications.module, modules[3])
          )
        );

      // Record application status with detailed information
      await tx
        .insert(applicationStatus)
        .values({
          applicationId: studentApplication[0].id,
          userEmail: user.email,
          status: status === "approved",
          updatedAs: "supervisor",
          comments: comments || "" // Ensure comments is never null
        });

      // If comments are provided, store them in text fields
      if (comments) {
        await tx
          .insert(textFields)
          .values({
            module: modules[3],
            fieldName: "supervisorReviewComments",
            userEmail: studentEmail,
            value: comments
          });
      }
    });

    res.status(HttpCode.OK).json({
      success: true,
      message: `Proposal ${status}`,
      status
    });
  })
);

export default router;