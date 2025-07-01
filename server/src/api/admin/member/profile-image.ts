import express from "express";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import environment from "@/config/environment.ts";
import {
    deleteProfileImage,
    getProfileImage,
    profileImageFileMiddleware,
    updateProfileImage,
} from "@/lib/profile/profile-image.ts";
import { checkAccess } from "@/middleware/auth.ts";
import { adminSchemas } from "lib";
import assert from "assert";

const router = express.Router();

router.get(
    "/",
    checkAccess(),
    asyncHandler(async (req, res) => {
        const parsed = adminSchemas.memberDetailsQuerySchema.parse(req.query);
        const profileImageId = await getProfileImage(parsed.email);
        res.json({
            profileImage: profileImageId
                ? environment.SERVER_URL + "/f/" + profileImageId
                : null,
        });
    })
);

router.post(
    "/",
    checkAccess(),
    ...profileImageFileMiddleware,
    asyncHandler(async (req, res) => {
        assert(req.file);
        const parsed = adminSchemas.editProfileImageBodySchema.parse(req.body);
        const profileImageId = await updateProfileImage(parsed.email, req.file);
        res.json({
            success: true,
            profileImage: environment.SERVER_URL + "/f/" + profileImageId,
        });
    })
);

router.delete(
    "/",
    checkAccess(),
    asyncHandler(async (req, res) => {
        const parsed = adminSchemas.editProfileImageBodySchema.parse(req.body);
        await deleteProfileImage(parsed.email);
        res.json({ success: true });
    })
);

export default router;
