import db from "@/config/db/index.ts";
import { checkAccess } from "@/middleware/auth.ts";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import express from "express";
import { type conferenceSchemas } from "lib";

const router = express.Router();

router.get(
    "/",
    checkAccess(),
    asyncHandler(async (req, res) => {
        const myApplications = (
            await db.query.conferenceApprovalApplications.findMany({
                with: {
                    user: {
                        with: {
                            faculty: true,
                            staff: true,
                            phd: true,
                        },
                    },
                    members: true,
                },
                where: ({ userEmail }, { and, eq }) =>
                    and(eq(userEmail, req.user!.email)),
            })
        ).map(({ ...appl }) => ({
            id: appl.id,
            state: appl.state,
            createdAt: appl.createdAt.toLocaleString(),
            hasMembersAssigned: appl.members.length > 0,
        }));

        const response: conferenceSchemas.submittedApplicationsResponse = {
            applications: myApplications,
        };

        res.status(200).json(response);
    })
);

export default router;
