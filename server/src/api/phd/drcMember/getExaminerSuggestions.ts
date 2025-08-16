import express from "express";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import { checkAccess } from "@/middleware/auth.ts";
import db from "@/config/db/index.ts";
import { phdExaminerSuggestions } from "@/config/db/schema/phd.ts";
import { HttpError, HttpCode } from "@/config/errors.ts";
import { eq } from "drizzle-orm";

const router = express.Router();

export default router.get(
  "/:applicationId",
  checkAccess(),
  asyncHandler(async (req, res, next) => {
    const applicationId = parseInt(req.params.applicationId);
    if (isNaN(applicationId)) {
      return next(new HttpError(HttpCode.BAD_REQUEST, "Invalid application ID"));
    }

    const suggestions = await db.query.phdExaminerSuggestions.findMany({
      where: eq(phdExaminerSuggestions.applicationId, applicationId),
    });
    
    if (suggestions.length === 0) {
        return next(new HttpError(HttpCode.NOT_FOUND, "No suggestions found for this application"));
    }

    const suggestionsMap = suggestions.reduce((acc, suggestion) => {
        acc[suggestion.qualifyingArea] = suggestion.suggestedExaminers;
        return acc;
    }, {} as Record<string, string[]>);

    res.status(200).json(suggestionsMap);
  }),
);