import db from "@/config/db/index.ts";
import { checkAccess } from "@/middleware/auth.ts";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import express from "express";
import { type conferenceSchemas } from "lib";

const router = express.Router();

router.get(
    "/",
    checkAccess(),
    asyncHandler(async (_, res) => {
        const pendingApplications = (
            await db.query.conferenceApprovalApplications.findMany({
                with: {
                    user: {
                        with: {
                            faculty: true,
                            staff: true,
                            phd: true,
                        },
                    },
                },
                // TODO: change state to fetch depending on member, convener, hod
                where: ({ state }, { and, eq }) => and(eq(state, "DRC Member")),
            })
        ).map(({ user, ...appl }) => ({
            id: appl.id,
            createdAt: appl.createdAt.toString(),
            userName: (user.faculty ?? user.staff ?? user.phd).name,
            userEmail: user.email,
            state: appl.state,
        }));

        const response: conferenceSchemas.pendingApplicationsResponse = {
            applications: pendingApplications,
        };

        res.status(200).json(response);
    })
);

export default router;
