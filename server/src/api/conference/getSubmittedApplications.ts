import db from "@/config/db/index.ts";
import { conferenceApprovalApplications } from "@/config/db/schema/conference.ts";
import { applications } from "@/config/db/schema/form.ts";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import express from "express";
import { eq } from "drizzle-orm";
import { checkAccess } from "@/middleware/auth.ts";
import type { conferenceSchemas } from "lib";

const router = express.Router();

const getSubmittedApplications = async (email: string) => {
    const submittedApplications = await db
        .select()
        .from(conferenceApprovalApplications)
        .innerJoin(
            applications,
            eq(conferenceApprovalApplications.applicationId, applications.id)
        )
        .where(eq(applications.userEmail, email));

    if (submittedApplications.length === 0) return { applications: [] };
    return {
        applications: submittedApplications.map((app) => ({
            id: app.applications.id,
            status: app.applications.status,
            createdAt:
                app.applications.createdAt.toLocaleDateString() +
                " " +
                app.applications.createdAt.toLocaleTimeString(),
        })),
    };
};

router.get(
    "/",
    checkAccess(),
    asyncHandler(async (req, res) => {
        const data = await getSubmittedApplications(req.user!.email);
        const response: conferenceSchemas.submittedApplicationsResponse = data;
        res.status(200).json(response);
    })
);

export default router;
