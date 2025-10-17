// This route is not authenticated, but it can be accessed by authenticated users.
// This was done so that the profile can be viewed by anyone.
import express from "express";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import db from "@/config/db/index.ts";
import { users } from "@/config/db/schema/admin.ts";
import { eq } from "drizzle-orm";
import { optionalAuth } from "@/middleware/optionalAuth.ts";
import { getProjectDataByEmail, getPatentsDataByEmail, getPublicationsDataByEmail } from "./myProfile.ts";

const router = express.Router();

router.get(
    "/:id",
    optionalAuth,
    asyncHandler(async (req, res) => {
        const { id } = req.params;
        const parsedID = Number(id);
        if (!Number.isInteger(parsedID) || parsedID <= 0) {
            res.status(400).json({ message: "Invalid profile ID" });
            return;
        }

        const data = await db
            .select()
            .from(users)
            .where(eq(users.id, parsedID));

        const userEmail = data[0]?.email;
        if (data.length === 0 || !userEmail) {
            res.status(404).json({ message: "Profile not found" });
            return;
        }

        // projects
        const parsedProjectsData = await getProjectDataByEmail(userEmail);
        // patents
        const parsedPatentsData = await getPatentsDataByEmail(userEmail);
        // publications
        const parsedPublicationsData =
            await getPublicationsDataByEmail(userEmail);

        // add all the data together
        var parsedData = {
            ...data[0],
            projects: parsedProjectsData,
            patents: parsedPatentsData,
            publications: parsedPublicationsData,
        };
        if (!req.user) parsedData.phone = null;
        else if (
            parsedData.email !== req.user.email &&
            !req.user.permissions.allowed.includes("admin:member:read") &&
            !req.user.permissions.allowed.includes("*")
        )
            parsedData.phone = null;

        res.status(200).json(parsedData);
    })
);

export default router;
