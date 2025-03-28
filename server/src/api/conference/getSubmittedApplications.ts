import db from "@/config/db/index.ts";
import { conferenceApprovalApplications } from "@/config/db/schema/conference.ts";
import { applications } from "@/config/db/schema/form.ts";
import { HttpCode, HttpError } from "@/config/errors.ts";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import express from "express";
import { eq } from "drizzle-orm";
import { checkAccess } from "@/middleware/auth.ts";

const router = express.Router();

router.get(
    "/",
    checkAccess(),
    asyncHandler(async (req, res, next) => {
        const submittedApplications = await db
            .select()
            .from(conferenceApprovalApplications)
            .innerJoin(
                applications,
                eq(
                    conferenceApprovalApplications.applicationId,
                    applications.id
                )
            )
            .where(eq(applications.userEmail, req.user!.email));

        if (submittedApplications.length === 0) {
            return next(
                new HttpError(
                    HttpCode.NOT_FOUND,
                    "No submitted applications found"
                )
            );
        }

        res.status(200).json({
            applications: submittedApplications,
        });
    })
);

export default router;
