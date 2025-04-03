import db from "@/config/db/index.ts";
import { HttpCode, HttpError } from "@/config/errors.ts";
import { checkAccess } from "@/middleware/auth.ts";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import express from "express";
import { conferenceSchemas, modules } from "lib";

const router = express.Router();

router.get(
    "/",
    checkAccess(),
    asyncHandler(async (req, res, next) => {
        const parsed = conferenceSchemas.pendingApplicationsQuerySchema.parse(
            req.query
        );
        const pendingApplications = (
            await db.query.applications.findMany({
                with: {
                    statuses: {
                        orderBy({ timestamp }, { desc }) {
                            return desc(timestamp);
                        },
                    },
                    user: {
                        with: {
                            faculty: true,
                            staff: true,
                            phd: true,
                        },
                    },
                    conferenceApplications: {
                        where: ({ state }, { eq }) => eq(state, parsed.state),
                    },
                },
                where: ({ userEmail, status, module }, { and, eq }) =>
                    and(
                        eq(userEmail, req.user!.email),
                        eq(status, "pending"),
                        eq(module, modules[0])
                    ),
            })
        )
            .filter((appl) => appl.conferenceApplications.length)
            .map(({ user, ...appl }) => ({
                id: appl.id,
                confId: appl.conferenceApplications[0].id,
                createdAt: appl.createdAt,
                userName: (user.faculty ?? user.staff ?? user.phd).name,
                status: appl.statuses[0],
                state: appl.conferenceApplications[0].state,
            }));

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
