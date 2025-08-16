import express from "express";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import { checkAccess } from "@/middleware/auth.ts";
import db from "@/config/db/index.ts";
import { phdExamApplications } from "@/config/db/schema/phd.ts";
import { eq } from "drizzle-orm";
import assert from "assert";

const router = express.Router();

export default router.get(
  "/",
  checkAccess(),
  asyncHandler(async (req, res) => {
    assert(req.user, "User must be defined");
    const supervisorEmail = req.user.email;

    // 1. Fetch all 'verified' applications and eager-load their related student and suggestions.
    const applications = await db.query.phdExamApplications.findMany({
      where: eq(phdExamApplications.status, "verified"),
      with: {
        student: true, // Eagerly load the related student record
        examinerSuggestions: { columns: { id: true } },
      },
    });

    // 2. Filter these applications in code to keep only those supervised by the current user.
    const supervisedApplications = applications
      .filter(app => app.student?.supervisorEmail === supervisorEmail)
      .map(app => {
        // We can safely assume app.student is not null here due to the filter
        if (!app.student) return null;

        return {
          id: app.id,
          studentName: app.student.name,
          studentEmail: app.student.email,
          qualifyingArea1: app.qualifyingArea1,
          qualifyingArea2: app.qualifyingArea2,
          hasSuggestions: app.examinerSuggestions.length > 0,
        };
      })
      .filter(Boolean); // Remove any null entries if they somehow get through

    res.status(200).json(supervisedApplications);
  }),
);