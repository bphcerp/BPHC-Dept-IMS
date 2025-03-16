import db from "@/config/db/index.ts";
import { conferenceApprovalApplications } from "@/config/db/schema/conference.ts";
import { applications } from "@/config/db/schema/form.ts";
import { HttpCode, HttpError } from "@/config/errors.ts";
import { checkAccess } from "@/middleware/auth.ts";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import express from "express";
import { eq } from "drizzle-orm";
import { users } from "@/config/db/schema/admin.ts";

const router = express.Router();

router.get(
    "/",
    checkAccess("drc-manage-conference-application"),
    asyncHandler(async (_, res, next) => {
        const pendingApplications = await db
            .select()
            .from(conferenceApprovalApplications)
            .innerJoin(
                applications,
                eq(
                    conferenceApprovalApplications.applicationId,
                    applications.id
                )
            )
            .innerJoin(users, eq(applications.userEmail, users.email))
            .where(eq(applications.status, "pending"));

        if (pendingApplications.length === 0) {
            return next(
                new HttpError(
                    HttpCode.NOT_FOUND,
                    "No pending applications found"
                )
            );
        }

        res.status(200).json({
            applications: pendingApplications,
        });
    })
);

export default router;
