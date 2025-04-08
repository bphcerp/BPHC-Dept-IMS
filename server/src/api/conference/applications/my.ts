import db from "@/config/db/index.ts";
import { checkAccess } from "@/middleware/auth.ts";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import express from "express";
import { type conferenceSchemas, modules } from "lib";

const router = express.Router();

router.get(
    "/",
    checkAccess(),
    asyncHandler(async (req, res) => {
        const myApplications = (
            await db.query.applications.findMany({
                with: {
                    user: {
                        with: {
                            faculty: true,
                            staff: true,
                            phd: true,
                        },
                    },
                    conferenceApplications: true,
                },
                where: ({ userEmail, module }, { and, eq }) =>
                    and(eq(userEmail, req.user!.email), eq(module, modules[0])),
            })
        )
            .filter((appl) => appl.conferenceApplications.length)
            .map(({ ...appl }) => ({
                id: appl.id,
                confId: appl.conferenceApplications[0].id,
                createdAt: appl.createdAt.toLocaleString(),
                state: appl.conferenceApplications[0].state,
                status: appl.status,
            }));

        const response: conferenceSchemas.submittedApplicationsResponse = {
            applications: myApplications,
        };

        res.status(200).json(response);
    })
);

export default router;
