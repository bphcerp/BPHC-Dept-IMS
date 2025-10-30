import { HttpCode, HttpError } from "@/config/errors.ts";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import express from "express";
import { conferenceSchemas } from "lib";
import { getApplicationById } from "@/lib/conference/index.ts";
import db from "@/config/db/index.ts";
import { checkAccess } from "@/middleware/auth.ts";
import { getUsersWithPermission } from "@/lib/common/index.ts";

const router = express.Router();

router.get(
    "/:id",
    checkAccess(),
    asyncHandler(async (req, res, next) => {
        const id = parseInt(req.params.id);
        if (isNaN(id) || id <= 0)
            return next(new HttpError(HttpCode.BAD_REQUEST, "Invalid id"));

        const application = await getApplicationById(id);

        if (!application)
            return next(
                new HttpError(HttpCode.NOT_FOUND, "Application not found")
            );

        const allMembers = (
            await getUsersWithPermission("conference:application:member")
        ).map((member) => ({ email: member.email, name: member.name }));

        const currentMembers =
            await db.query.conferenceApplicationMembers.findMany({
                where: (cols, { eq }) => eq(cols.applicationId, id),
            });

        const response: conferenceSchemas.GetMembersResponse = {
            members: currentMembers.map((member) => member.memberEmail),
            allMembers,
        };

        res.status(200).json(response);
    })
);

export default router;
