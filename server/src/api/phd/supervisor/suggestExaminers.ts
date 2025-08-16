import express from "express";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import { checkAccess } from "@/middleware/auth.ts";
import db from "@/config/db/index.ts";
import { phdSchemas } from "lib";
import { phdExaminerSuggestions, phdExamApplications } from "@/config/db/schema/phd.ts";
import { HttpError, HttpCode } from "@/config/errors.ts";
import { eq, sql } from "drizzle-orm";
import assert from "assert";

const router = express.Router();

export default router.post(
  "/",
  checkAccess(),
  asyncHandler(async (req, res, next) => {
    assert(req.user, "User must be defined");
    const supervisorEmail = req.user.email;

    const { applicationId, suggestionsArea1, suggestionsArea2 } =
      phdSchemas.suggestExaminersSchema.parse(req.body);

    const application = await db.query.phdExamApplications.findFirst({
        where: eq(phdExamApplications.id, applicationId),
        with: {
            student: {
                columns: { supervisorEmail: true }
            }
        }
    });

    if (!application) {
        return next(new HttpError(HttpCode.NOT_FOUND, "Application not found"));
    }

    if (application.student.supervisorEmail !== supervisorEmail) {
        return next(new HttpError(HttpCode.FORBIDDEN, "You are not the supervisor for this student"));
    }

    await db.transaction(async (tx) => {
        await tx.insert(phdExaminerSuggestions).values([
            {
                applicationId,
                qualifyingArea: application.qualifyingArea1,
                suggestedExaminers: suggestionsArea1,
            },
            {
                applicationId,
                qualifyingArea: application.qualifyingArea2,
                suggestedExaminers: suggestionsArea2,
            },
        ]).onConflictDoUpdate({
            target: [phdExaminerSuggestions.applicationId, phdExaminerSuggestions.qualifyingArea],
            set: { suggestedExaminers: sql`excluded.suggested_examiners` }
        });
    });

    res.status(200).json({ success: true, message: "Examiner suggestions submitted successfully" });
  }),
);