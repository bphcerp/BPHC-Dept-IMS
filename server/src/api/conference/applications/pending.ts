import db from "@/config/db/index.ts";
import { HttpCode, HttpError } from "@/config/errors.ts";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import express from "express";
import { authUtils, type conferenceSchemas } from "lib";

const router = express.Router();

router.get(
    "/",
    asyncHandler(async (req, res, next) => {
        const isMember = authUtils.checkAccess(
            "conference:application:member",
            req.user!.permissions
        );
        const isHoD = authUtils.checkAccess(
            "conference:application:hod",
            req.user!.permissions
        );
        const isConvener = authUtils.checkAccess(
            "conference:application:convener",
            req.user!.permissions
        );
        const canGetFlow = authUtils.checkAccess(
            "conference:application:get-flow",
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

        const pendingApplications = isMember
            ? (
                  await db.query.conferenceApplicationMembers.findMany({
                      where: (cols, { eq, and, isNull }) =>
                          and(
                              eq(cols.memberEmail, req.user!.email),
                              isNull(cols.reviewStatus)
                          ),
                      with: {
                          application: true,
                          user: true,
                      },
                  })
              )
                  .map(({ user, application }) => ({
                      id: application.id,
                      state: application.state,
                      createdAt: application.createdAt.toLocaleString(),
                      userEmail: user.email,
                      userName: user.name,
                  }))
                  .filter(({ state }) => state === "DRC Member")
            : (
                  await db.query.conferenceApprovalApplications.findMany({
                      with: {
                          user: true,
                          members: {
                              where: (cols, { ne }) =>
                                  ne(cols.memberEmail, req.user!.email),
                          },
                      },
                      where: ({ state }, { eq, or }) =>
                          isConvener
                              ? or(
                                    eq(state, "DRC Member"),
                                    eq(state, "DRC Convener")
                                )
                              : undefined,
                  })
              ).map(({ user, ...appl }) => ({
                  id: appl.id,
                  state: appl.state,
                  createdAt: appl.createdAt.toLocaleString(),
                  userEmail: user.email,
                  userName: user.name,
                  membersAssigned: appl.members.length,
                  membersReviewed: appl.members.filter(
                      (m) => m.reviewStatus !== null
                  ).length,
              }));

        const isDirect =
            (
                await db.query.conferenceGlobal.findFirst({
                    where: (conferenceGlobal, { eq }) =>
                        eq(conferenceGlobal.key, "directFlow"),
                })
            )?.value === "true";

        const response: conferenceSchemas.pendingApplicationsResponse = {
            applications: pendingApplications,
            isDirect: canGetFlow ? isDirect : undefined,
        };

        res.status(200).json(response);
    })
);

export default router;
