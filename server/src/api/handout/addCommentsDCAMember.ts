import express from "express";
import assert from "assert";
import { handoutSchemas } from "lib";
import db from "@/config/db/index.ts";
import { applicationStatus, textFieldStatus } from "@/config/db/schema/form.ts";
import { HttpCode, HttpError } from "@/config/errors.ts";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import { checkAccess } from "@/middleware/auth.ts";

const router = express.Router();

router.post(
    "/:appid",
    checkAccess("dca-member"),
    asyncHandler(async (req, res, next) => {
        const parsed = handoutSchemas.dcaMemberCommentsRequestSchema.parse(req);

        const handout = await db.query.courseHandoutRequests.findFirst({
            where: (handout, { eq }) =>
                eq(handout.applicationId, parsed.params.appid),
        });

        if (!handout) {
            return next(
                new HttpError(HttpCode.NOT_FOUND, "Application Not Found")
            );
        }

        await db.transaction(async (tx) => {
            assert(req.user);
            for (const [key, value] of Object.entries(
                parsed.body.fieldReviews as Record<
                    string,
                    { comments: string; approved: boolean }
                >
            )) {
                await tx.insert(textFieldStatus).values({
                    comments: value.comments,
                    status: value.approved,
                    userEmail: req.user?.email,
                    updatedAs: "dca-member",
                    textField: handout[key as keyof typeof handout]!,
                });
            }

            await tx.insert(applicationStatus).values({
                applicationId: handout.applicationId,
                comments: parsed.body.review,
                status: parsed.body.status,
                updatedAs: "dca-member",
                userEmail: req.user?.email,
            });
        });

        res.status(201).json({ success: true });
    })
);

export default router;
