import db from "@/config/db/index.ts";
import { applications, applicationStatus } from "@/config/db/schema/form.ts";
import { HttpCode, HttpError } from "@/config/errors.ts";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import assert from "assert";
import { eq } from "drizzle-orm";
import express from "express";
import { handoutSchemas } from "lib";

const router = express.Router();

router.post(
    "/:appid",
    asyncHandler(async (req, res, next) => {
        assert(req.user);

        const parsed = handoutSchemas.dcaConvenorCommentsSchema.parse(req);

        const handout = await db.query.courseHandoutRequests.findFirst({
            where: (handout, { eq }) =>
                eq(handout.applicationId, parsed.params.appid),
        });

        if (!handout) {
            return next(
                new HttpError(HttpCode.NOT_FOUND, "Application Not Found")
            );
        }

        await db.insert(applicationStatus).values({
            applicationId: handout.applicationId,
            comments: parsed.body.review,
            status: parsed.body.status,
            updatedAs: "dca-convenor",
            userEmail: req.user?.email,
        });

        if (parsed.body.status === false)
            await db
                .update(applications)
                .set({ status: "rejected" })
                .where(eq(applications.id, parsed.params.appid));

        res.status(201).json({ success: true });
    })
);

export default router;
