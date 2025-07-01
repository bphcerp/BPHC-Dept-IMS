import express from "express";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import environment from "@/config/environment.ts";
import {
    deleteProfileImage,
    getProfileImage,
    profileImageFileMiddleware,
    updateProfileImage,
} from "@/lib/profile/profile-image.ts";
import assert from "assert";

const router = express.Router();

router.get(
    "/",
    asyncHandler(async (req, res) => {
        const profileImageId = await getProfileImage(req.user!.email);
        res.json({
            profileImage: profileImageId
                ? environment.SERVER_URL + "/f/" + profileImageId
                : null,
        });
    })
);

router.post(
    "/",
    ...profileImageFileMiddleware,
    asyncHandler(async (req, res) => {
        assert(req.file);
        res.json({
            success: true,
            profileImage:
                environment.SERVER_URL +
                "/f/" +
                (await updateProfileImage(req.user!.email, req.file)),
        });
    })
);

router.delete(
    "/",
    asyncHandler(async (req, res) => {
        await deleteProfileImage(req.user!.email);
        res.json({ success: true });
    })
);

export default router;
