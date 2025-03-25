import express from "express";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import { checkAccess } from "@/middleware/auth.ts";
import db from "@/config/db/index.ts";
import {
  applications,
  applicationStatus
} from "@/config/db/schema/form.ts";
import { eq, and, desc } from "drizzle-orm";
import { HttpCode, HttpError } from "@/config/errors.ts";
import { modules } from "lib";

const router = express.Router();

router.get(
  "/",
  checkAccess(),
  asyncHandler(async (req, res) => {
    const user = req.user;
    if (!user) {
      throw new HttpError(HttpCode.UNAUTHORIZED, "User not authenticated");
    }

    // Check if any application exists for PhD module
    const existingApplications = await db
      .select({ id: applications.id })
      .from(applications)
      .where(
        and(
          eq(applications.userEmail, user.email),
          eq(applications.module, modules[3]) // PhD module
        )
      );

    // If no applications exist, show proposal form
    if (existingApplications.length === 0) {
       res.status(200).json({
        success: true,
        showProposal: true,
        documents: {
          proposal: [{
            status: "pending"
          }]
        }
      });
      return;
    }

    // Find the latest application status for PhD module
    const latestApplicationStatus = await db
      .select({
        status: applicationStatus.status
      })
      .from(applicationStatus)
      .innerJoin(
        applications, 
        eq(applicationStatus.applicationId, applications.id)
      )
      .where(
        and(
          eq(applications.userEmail, user.email),
          eq(applications.module, modules[3]) // PhD module
        )
      )
      .orderBy(desc(applicationStatus.id))
      .limit(1);

    // Determine proposal visibility and status
    let showProposal = false;
    let proposalStatus = "pending";

    // If latest status is false, show proposal form
    if (latestApplicationStatus.length > 0 && latestApplicationStatus[0].status === false) {
      showProposal = true;
      proposalStatus = "rejected";
    }
    if (latestApplicationStatus.length > 0 && latestApplicationStatus[0].status === true) {
      showProposal = false;
      proposalStatus = "approved";
    }

    res.status(200).json({
      success: true,
      showProposal,
      documents: {
        proposal: [{
          status: proposalStatus
        }]
      }
    });
  })
);

export default router;