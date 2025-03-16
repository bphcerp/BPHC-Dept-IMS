import express from "express";
import assert from "assert";
import db from "@/config/db/index.ts";
import { checkAccess } from "@/middleware/auth.ts";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import { handoutSchemas } from "lib";
import { and, eq, inArray } from "drizzle-orm";
import { courseHandoutRequests } from "@/config/db/schema/handout.ts";
import { 
    textFieldStatus, 
    fileFieldStatus
} from "@/config/db/schema/form.ts";
import { HttpError, HttpCode } from "@/config/errors.ts";

const router = express.Router();

router.get(
    "/",
    checkAccess("dca-member-get-comment"),
    asyncHandler(async (req, res, next) => {
        assert(req.user);

        const parsed = handoutSchemas.getReviewDCAMemberQuerySchema.parse(
            req.query
        );

        const { email, applicationId } = parsed;

        const handoutRequest = await db.query.courseHandoutRequests.findFirst({
            where: eq(courseHandoutRequests.applicationId, applicationId)
        });

        if (!handoutRequest) {
            return next(
                new HttpError(HttpCode.NOT_FOUND, "Application Not Found")
            );
        }

        const textFieldIds = [
            handoutRequest.courseCode,
            handoutRequest.courseName,
            handoutRequest.courseStrength,
            handoutRequest.openBook,
            handoutRequest.closedBook,
            handoutRequest.midSem,
            handoutRequest.compre,
            handoutRequest.numComponents,
            handoutRequest.frequency
        ].filter(id => id !== null);

        const fileFieldIds = [
            handoutRequest.handoutFilePath
        ].filter(id => id !== null);

        const textFieldReviews = await db.query.textFieldStatus.findMany({
            where: and(
                inArray(textFieldStatus.textField, textFieldIds),
                eq(textFieldStatus.userEmail, email)
            ),
            with: {
                textField: true
            }
        });

        const fileFieldReviews = await db.query.fileFieldStatus.findMany({
            where: and(
                inArray(fileFieldStatus.fileField, fileFieldIds),
                eq(fileFieldStatus.userEmail, email)
            ),
            with: {
                fileField: true
            }
        });

        const reviews = {
            textFieldReviews: textFieldReviews.map(review => ({
                fieldId: review.textField.id,
                fieldName: review.textField.fieldName,
                reviewId: review.id,
                comments: review.comments,
                status: review.status,
                updatedAs: review.updatedAs
            })),
            fileFieldReviews: fileFieldReviews.map(review => ({
                fieldId: review.fileField.id,
                fieldName: review.fileField.fieldName,
                reviewId: review.id,
                comments: review.comments,
                status: review.status,
                updatedAs: review.updatedAs
            }))
        };

        res.status(200).json({
            email,
            applicationId,
            reviews
        });
    })
);

export default router;