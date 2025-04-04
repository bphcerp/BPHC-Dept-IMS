import db from "@/config/db/index.ts";
import { checkAccess } from "@/middleware/auth.ts";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import express from "express";
import { conferenceSchemas, modules } from "lib";

const router = express.Router();

router.get(
    "/",
    checkAccess(),
    asyncHandler(async (req, res) => {
        // const parsed = conferenceSchemas.pendingApplicationsQuerySchema.parse(
        //     req.query
        // );
        const pendingApplications = (
            await db.query.applications.findMany({
                with: {
                    user: {
                        with: {
                            faculty: true,
                            staff: true,
                            phd: true,
                        },
                    },
                    conferenceApplications: {
                        // where: ({ state }, { eq }) => eq(state, parsed.state),
                    },
                },
                where: ({ status, module }, { and, eq }) =>
                    and(eq(status, "pending"), eq(module, modules[0])),
            })
        )
            .filter((appl) => appl.conferenceApplications.length)
            .map(({ user, ...appl }) => ({
                id: appl.id,
                confId: appl.conferenceApplications[0].id,
                createdAt: appl.createdAt.toString(),
                userName: (user.faculty ?? user.staff ?? user.phd).name,
                userEmail: user.email,
                state: appl.conferenceApplications[0].state,
            }));

        const response: conferenceSchemas.pendingApplicationsResponse = {
            applications: pendingApplications,
        };

        res.status(200).json(response);
    })
);

export default router;
