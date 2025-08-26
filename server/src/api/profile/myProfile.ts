import express from "express";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import db from "@/config/db/index.ts";
import { users } from "@/config/db/schema/admin.ts";
import { eq } from "drizzle-orm";

const router = express.Router();

router.get(
    "/",
    asyncHandler(async (req, res) => {
        if (!req.user) {
            res.status(401).json({ message: "Unauthorized" });
            return;
        }

        const data = await db
            .select()
            .from(users)
            .where(eq(users.email, req.user.email));
        if (data.length === 0) {
            res.status(404).json({ message: "Profile not found" });
            return;
        }
        res.status(200).json(data[0]);
    })
);

export default router;
