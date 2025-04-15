import db from "@/config/db/index.ts";
import { HttpCode, HttpError } from "@/config/errors.ts";
import { checkAccess } from "@/middleware/auth.ts";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import express from "express";
import { authUtils, type conferenceSchemas } from "lib";

const router = express.Router();

router.get(
    "/",
    checkAccess(),
    asyncHandler(async (req, res, next) => {
        const isMember = authUtils.checkAccess(
            "conference:application:review-application-member",
            req.user!.permissions
        );
        const isHoD = authUtils.checkAccess(
            "conference:application:review-application-hod",
            req.user!.permissions
        );
        const isConvener = authUtils.checkAccess(
            "conference:application:review-application-convener",
            req.user!.permissions
        );

        if (!(isMember || isHoD || isConvener)) {
            return next(
                new HttpError(
                    HttpCode.FORBIDDEN,
                    "You must be DRC Member, Convener, or HoD to view pending applications"
                )
            );
        }

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
                    reviews: {
                        where: (r, { ne }) =>
                            ne(r.reviewerEmail, req.user!.email),
                    },
                },
                where: ({ state }, { eq }) =>
                    eq(
                        state,
                        isMember
                            ? "DRC Member"
                            : isConvener
                              ? "DRC Convener"
                              : "HoD"
                    ),
            })
        ).map(({ user, ...appl }) => ({
            id: appl.id,
            state: appl.state,
            createdAt: appl.createdAt.toLocaleString(),
            userEmail: user.email,
            userName: user.faculty.name ?? user.staff.name ?? user.phd.name,
        }));

        const response: conferenceSchemas.pendingApplicationsResponse = {
            applications: pendingApplications,
        };

        res.status(200).json(response);
    })
);

export default router;
