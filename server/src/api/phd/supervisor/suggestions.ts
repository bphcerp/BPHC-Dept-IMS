// server/src/api/phd/supervisor/suggestions.ts
import express from "express";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import { checkAccess } from "@/middleware/auth.ts";
import db from "@/config/db/index.ts";
import { phdExaminerSuggestions } from "@/config/db/schema/phd.ts";
import { eq, and } from "drizzle-orm";
import { HttpError, HttpCode } from "@/config/errors.ts";
import { completeTodo } from "@/lib/todos/index.ts";
import { modules } from "lib";
import { z } from "zod";
import assert from "assert";

const router = express.Router();

// GET /phd/supervisor/pending-suggestions - List pending suggestion requests
router.get("/pending-suggestions", checkAccess(), asyncHandler(async (req, res) => {
  assert(req.user);
  const supervisorEmail = req.user.email;

  const pendingSuggestions = await db.query.phdExaminerSuggestions.findMany({
    where: and(
      eq(phdExaminerSuggestions.supervisorEmail, supervisorEmail),
      eq(phdExaminerSuggestions.status, 'Pending')
    ),
    with: {
      application: {
        with: {
          student: true,
          examEvent: true,
        },
      },
    },
  });

  const formattedSuggestions = pendingSuggestions.map(suggestion => ({
    suggestionRequestId: suggestion.id,
    studentName: suggestion.application.student?.name || "Unknown",
    qualifyingArea1: suggestion.application.qualifyingArea1,
    qualifyingArea2: suggestion.application.qualifyingArea2,
    examEventName: suggestion.application.examEvent.name,
  }));

  res.status(200).json({
    success: true,
    pendingRequests: formattedSuggestions,
  });
}));

// POST /phd/supervisor/suggestions - Submit examiner suggestions
const submitSuggestionsSchema = z.object({
  suggestionRequestId: z.number(),
  subArea1Examiners: z.array(z.string().email()).min(1).max(4),
  subArea2Examiners: z.array(z.string().email()).min(1).max(4),
});

router.post("/suggestions", checkAccess(), asyncHandler(async (req, res, next) => {
  assert(req.user);
  const supervisorEmail = req.user.email;
  const parsed = submitSuggestionsSchema.parse(req.body);

  // Verify the suggestion request belongs to this supervisor
  const suggestionRequest = await db.query.phdExaminerSuggestions.findFirst({
    where: and(
      eq(phdExaminerSuggestions.id, parsed.suggestionRequestId),
      eq(phdExaminerSuggestions.supervisorEmail, supervisorEmail),
      eq(phdExaminerSuggestions.status, 'Pending')
    ),
    with: {
      application: {
        with: {
          student: true,
          examEvent: true,
        },
      },
    },
  });

  if (!suggestionRequest) {
    return next(new HttpError(HttpCode.NOT_FOUND, "Suggestion request not found or already submitted"));
  }

  // Update the suggestion record
  const [updatedSuggestion] = await db.update(phdExaminerSuggestions)
    .set({
      subArea1Examiners: parsed.subArea1Examiners,
      subArea2Examiners: parsed.subArea2Examiners,
      status: 'Submitted',
      submittedAt: new Date(),
    })
    .where(eq(phdExaminerSuggestions.id, parsed.suggestionRequestId))
    .returning();

  // Complete the todo
  await completeTodo({
    module: modules[4],
    completionEvent: `examiner_suggestions_${suggestionRequest.application.examEventId}_${supervisorEmail}`,
  });

  res.status(200).json({
    success: true,
    message: `Examiner suggestions for ${suggestionRequest.application.student?.name} have been submitted.`,
  });
}));

export default router;
