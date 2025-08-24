import express from "express";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import { editProfileBody } from "node_modules/lib/src/schemas/Profile.ts";
import { eq } from "drizzle-orm";
import { users } from "@/config/db/schema/admin.ts";
import db from "@/config/db/index.ts";

const router = express.Router();

router.put(
    "/",
    asyncHandler(async (req, res) => {
        if (!req.user) {
            res.status(401).json({ error: "Unauthorized" });
            return;
        }

        const parsedBody = editProfileBody.parse(req.body);
        if (Object.values(parsedBody).length === 0) {
            res.status(400).json({ error: "No fields to update" });
            return;
        }

        const updatedUser = await db
            .update(users)
            .set(parsedBody)
            .where(eq(users.email, req.user.email));

        if (updatedUser.rowCount === 0) {
            res.status(404).json({ error: "User not found" });
            return;
        }
        res.status(200).json({
            message: "Profile updated successfully",
        });
    })
);

export default router;
