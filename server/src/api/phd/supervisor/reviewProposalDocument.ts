import express from "express";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import { checkAccess } from "@/middleware/auth.ts";
import db from "@/config/db/index.ts";
import { phd } from "@/config/db/schema/admin.ts";
import { applications } from "@/config/db/schema/form.ts";
import { eq } from "drizzle-orm";
import { HttpCode, HttpError } from "@/config/errors.ts";
import { z } from "zod";

const reviewSchema = z.object({
  status: z.enum(["approved", "rejected"]),
  comments: z.string().optional(),
  dacMembers: z.array(z.string()).optional(),
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

    const { status,  dacMembers } = reviewSchema.parse(req.body);

    const studentApplication = await db.query.applications.findFirst({
      where: (app) => eq(app.userEmail, user.email),
      with: {
        user: {
          with: {
            phd: true
          }
        }
      }
    });

    if (!studentApplication) {
      throw new HttpError(HttpCode.NOT_FOUND, "No application found");
    }

    const isPrimaryOrCoSupervisor = 
      studentApplication.user.phd?.supervisorEmail === user.email ||
      studentApplication.user.phd?.coSupervisorEmail === user.email ||
      studentApplication.user.phd?.coSupervisorEmail2 === user.email;

    if (!isPrimaryOrCoSupervisor) {
      throw new HttpError(HttpCode.FORBIDDEN, "Not authorized to review this application");
    }

    await db.transaction(async (tx) => {
      await tx
        .update(applications)
        .set({ status: status === "approved" ? "approved" : "rejected" })
        .where(eq(applications.id, studentApplication.id));

      if (status === "approved" && dacMembers && dacMembers.length > 0) {
        await tx
          .update(phd)
          .set({ 
            suggestedDacMembers: dacMembers,
            dac1Email: dacMembers[0],
            dac2Email: dacMembers[1] || null
          })
          .where(eq(phd.email, studentApplication.userEmail));
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