import { HttpCode, HttpError } from "@/config/errors.ts";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import express from "express";
import { authUtils } from "lib";
import { checkAccess } from "@/middleware/auth.ts";
import { permissions } from "lib";
import { getApplicationById } from "@/lib/conference/index.ts";

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

        const allowedToViewAny = authUtils.checkAccess(
            permissions["/conference/applications/view"],
            req.user!.permissions
        );

        if (!allowedToViewAny && application.userEmail !== req.user!.email)
            return next(
                new HttpError(
                    HttpCode.FORBIDDEN,
                    "You are not allowed to view this application"
                )
            );

        const response = {
            ...application,
            createdAt: application.createdAt.toLocaleString(),
        };

        res.status(200).send(response);
    })
);

export default router;
