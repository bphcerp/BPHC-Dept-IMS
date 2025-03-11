import express from "express";
import assert from "assert";
import db from "@/config/db/index.ts";
import { checkAccess } from "@/middleware/auth.ts";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import { eq } from "drizzle-orm";
import z from "zod";

const router = express.Router();

const getApplicationFacultyBodySchema = z.object({
  applicationId: z.string().transform((val) => parseInt(val, 10)),
});

interface ApplicationFaculty {
  applicationId: number;
  courseCode: string;
  courseName: string;
  openBook: string;
  closedBook: string;
  midSem: string;
  compre: string;
  frequency: string;
  numComponents: string;
  status: string;
}

router.get(
  "/",
  checkAccess("get-handout-faculty"),
  asyncHandler(async (req, res, _next) => {
    assert(req.user);

    try {
      const parsed = getApplicationFacultyBodySchema.parse(req.query);
      const { applicationId } = parsed;

      const application = await db.query.applications.findFirst({
        where: (app) => eq(app.id, applicationId),
        with: {
          statuses: true,
          courseHandoutRequests: {
            with: {
              courseCode: true,
              courseName: true,
              openBook: true,
              closedBook: true,
              midSem: true,
              compre: true,
              frequency: true,
              numComponents: true
            }
          }
        }
      });

      if (!application) {
        res.status(404).json({
          success: false,
          message: "Application not found"
        });
        return;
      }

      const handoutRequest = application.courseHandoutRequests[0];
      
      if (!handoutRequest) {
        res.status(404).json({
          success: false,
          message: "Course handout request not found"
        });
        return;
      }

      const result: ApplicationFaculty = {
        applicationId: application.id,
        courseCode: handoutRequest.courseCode?.value ?? "",
        courseName: handoutRequest.courseName?.value ?? "",
        openBook: handoutRequest.openBook?.value ?? "",
        closedBook: handoutRequest.closedBook?.value ?? "",
        midSem: handoutRequest.midSem?.value ?? "",
        compre: handoutRequest.compre?.value ?? "",
        frequency: handoutRequest.frequency?.value ?? "",
        numComponents: handoutRequest.numComponents?.value ?? "",
        status: application.statuses.length === 0 ? "Not Verified" : "Marked for Resubmission"
      };

      res.status(200).json({ success: true, result });
    } catch (error) {
      console.error("Error fetching application:", error);
      res.status(400).json({
        success: false,
        message: error instanceof z.ZodError
          ? "Invalid application ID"
          : "Failed to fetch application details"
      });
    }
  })
);

export default router;
