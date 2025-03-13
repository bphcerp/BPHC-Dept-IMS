import db from "@/config/db/index.ts";
import { conferenceApprovalApplications } from "@/config/db/schema/conference.ts";
import { HttpCode, HttpError } from "@/config/errors.ts";
import { checkAccess } from "@/middleware/auth.ts";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import express from "express";
import { eq, and } from "drizzle-orm";
import { conferenceSchemas } from "lib";
import { applications } from "@/config/db/schema/form.ts";

const router = express.Router();

router.post(
    "/:id",
    checkAccess("drc-manage-conference-application"),
    asyncHandler(async (req, res, next) => {
        const parsed = conferenceSchemas.finalizeApproveApplicationSchema.parse(
            req.body
        );
        const id = parseInt(req.params.id);
        if (isNaN(id)) {
            next(new HttpError(HttpCode.BAD_REQUEST, "Invalid id"));
        }

        const application = await db
            .select()
            .from(conferenceApprovalApplications)
            .innerJoin(
                applications,
                eq(
                    conferenceApprovalApplications.applicationId,
                    applications.id
                )
            )
            .where(
                and(
                    eq(applications.status, "pending"),
                    eq(conferenceApprovalApplications.id, id)
                )
            );

        if (application.length === 0) {
            next(new HttpError(HttpCode.NOT_FOUND, "Application not found"));
        }

        await db
            .update(applications)
            .set({
                status: parsed.approve ? "approved" : "rejected",
            })
            .where(eq(applications.id, application[0].applications.id));

        res.status(HttpCode.OK).send();
    })
);

export default router;
