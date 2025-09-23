import express from "express";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import { checkAccess } from "@/middleware/auth.ts";
import db from "@/config/db/index.ts";
import { phdSchemas } from "lib";
import {
    phdExamApplications,
    phdExaminerSuggestions,
    phdExaminerAssignments,
} from "@/config/db/schema/phd.ts";
import { HttpError, HttpCode } from "@/config/errors.ts";
import { eq, and, sql } from "drizzle-orm";

const router = express.Router();

export default router.post(
    "/",
    checkAccess(),
    asyncHandler(async (req, res, next) => {
        const { applicationId, examinerArea1, examinerArea2 } =
            phdSchemas.assignExaminersSchema.parse(req.body);

        const application = await db.query.phdExamApplications.findFirst({
            where: eq(phdExamApplications.id, applicationId),
        });

        if (!application) {
            return next(
                new HttpError(HttpCode.NOT_FOUND, "Application not found")
            );
        }

        const suggestionsArea1 =
            await db.query.phdExaminerSuggestions.findFirst({
                where: and(
                    eq(phdExaminerSuggestions.applicationId, applicationId),
                    eq(
                        phdExaminerSuggestions.qualifyingArea,
                        application.qualifyingArea1
                    )
                ),
            });

        const suggestionsArea2 =
            await db.query.phdExaminerSuggestions.findFirst({
                where: and(
                    eq(phdExaminerSuggestions.applicationId, applicationId),
                    eq(
                        phdExaminerSuggestions.qualifyingArea,
                        application.qualifyingArea2
                    )
                ),
            });

        if (!suggestionsArea1 || !suggestionsArea2) {
            return next(
                new HttpError(
                    HttpCode.BAD_REQUEST,
                    "Suggestions not found for both areas"
                )
            );
        }

        if (
            !suggestionsArea1.suggestedExaminers.includes(examinerArea1) ||
            !suggestionsArea2.suggestedExaminers.includes(examinerArea2)
        ) {
            return next(
                new HttpError(
                    HttpCode.BAD_REQUEST,
                    "Selected examiner is not in the suggested list"
                )
            );
        }

        try {
            await db
                .insert(phdExaminerAssignments)
                .values([
                    {
                        applicationId,
                        qualifyingArea: application.qualifyingArea1,
                        examinerEmail: examinerArea1,
                    },
                    {
                        applicationId,
                        qualifyingArea: application.qualifyingArea2,
                        examinerEmail: examinerArea2,
                    },
                ])
                .onConflictDoUpdate({
                    target: [
                        phdExaminerAssignments.applicationId,
                        phdExaminerAssignments.qualifyingArea,
                    ],
                    set: {
                        examinerEmail: sql`excluded.examiner_email`,
                        hasAccepted: null,
                        notifiedAt: null,
                        qpSubmitted: false,
                    },
                });
        } catch (e) {
            if ((e as { code: string }).code === "23503")
                throw new HttpError(
                    HttpCode.BAD_REQUEST,
                    "One of the examiners does not exist"
                );
            throw e;
        }

        res.status(200).json({
            success: true,
            message: "Examiners assigned successfully",
        });
    })
);
