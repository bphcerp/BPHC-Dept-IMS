import { HttpCode, HttpError } from "@/config/errors.ts";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import express from "express";
import { authUtils } from "lib";
import { getApplicationWithFileUrls } from "@/lib/conference/index.ts";
import db from "@/config/db/index.ts";

const router = express.Router();

router.get(
    "/:id",
    asyncHandler(async (req, res, next) => {
        if (!req.user)
            throw new HttpError(HttpCode.UNAUTHORIZED, "Unauthorized");

        const id = parseInt(req.params.id);
        if (isNaN(id) || id <= 0)
            return next(new HttpError(HttpCode.BAD_REQUEST, "Invalid id"));

        const isMember = authUtils.checkAccess(
            "conference:application:member",
            req.user!.permissions
        );
        const isHoD = authUtils.checkAccess(
            "conference:application:hod",
            req.user!.permissions
        );
        const isConvener = authUtils.checkAccess(
            "conference:application:convener",
            req.user!.permissions
        );

        const _application = await getApplicationWithFileUrls(id);

        if (!_application)
            return next(
                new HttpError(HttpCode.NOT_FOUND, "Application not found")
            );

        const application = {
            ..._application,
            createdAt: _application.createdAt.toLocaleString(),
        };

        const reviews = await db.query.conferenceApplicationMembers.findMany({
            where: (cols, { eq }) => eq(cols.applicationId, application.id),
        });

        const statusLog = await db.query.conferenceStatusLog.findMany({
            where: (cols, { eq }) => eq(cols.applicationId, application.id),
            orderBy: (cols, { desc }) => [desc(cols.timestamp)],
        });

        const isDirect =
            (
                await db.query.conferenceGlobal.findFirst({
                    where: (conferenceGlobal, { eq }) =>
                        eq(conferenceGlobal.key, "directFlow"),
                })
            )?.value === "true";

        const forbiddenError = new HttpError(
            HttpCode.FORBIDDEN,
            "You are not allowed to view this application"
        );

        const baseConvenerResponse = {
            application,
            reviews: reviews.map((x) => {
                return {
                    status: x.reviewStatus,
                    comments: x.comments,
                    createdAt: x.updatedAt,
                };
            }),
            isDirect,
        };

        if (application.state === "Faculty") {
            if (!(isHoD || application.userEmail === req.user!.email))
                throw forbiddenError;

            res.status(200).send({
                application,
                reviews: [
                    {
                        comments: statusLog[0]?.comments,
                        status: false,
                        createdAt: statusLog[0]
                            ? statusLog[0].timestamp.toLocaleString()
                            : undefined,
                    },
                ],
                ...(isHoD ? { statusLog } : {}),
            });
            return;
        } else if (application.state === "DRC Member") {
            const pendingReviewAsMember =
                await db.query.conferenceApplicationMembers.findFirst({
                    where: (cols, { eq, and, isNull }) =>
                        and(
                            eq(cols.applicationId, application.id),
                            eq(cols.memberEmail, req.user!.email),
                            isNull(cols.reviewStatus)
                        ),
                });
            if (isHoD) {
                res.status(200).send({
                    ...baseConvenerResponse,
                    pendingReviewAsMember: !!pendingReviewAsMember,
                    statusLog,
                });
                return;
            } else if (isConvener) {
                res.status(200).send({
                    ...baseConvenerResponse,
                    pendingReviewAsMember: !!pendingReviewAsMember,
                });
                return;
            } else if (isMember && pendingReviewAsMember) {
                res.status(200).send({
                    application,
                    pendingReviewAsMember: !!pendingReviewAsMember,
                });
                return;
            } else if (application.userEmail !== req.user!.email)
                throw forbiddenError;
        } else if (application.state === "DRC Convener") {
            if (isHoD) {
                res.status(200).send({ ...baseConvenerResponse, statusLog });
                return;
            } else if (isConvener) {
                res.status(200).send(baseConvenerResponse);
                return;
            } else if (application.userEmail !== req.user!.email) {
                throw forbiddenError;
            }
        } else {
            if (isHoD) {
                res.status(200).send({ ...baseConvenerResponse, statusLog });
                return;
            } else if (application.userEmail !== req.user!.email) {
                throw forbiddenError;
            }
        }
        res.status(200).send({ application });
    })
);

export default router;
