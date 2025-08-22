import express from "express";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import db from "@/config/db/index.ts";
import { users } from "@/config/db/schema/admin.ts";
import { eq } from "drizzle-orm";

const router = express.Router();

router.get(
    "/:id",
    asyncHandler(async (req, res) => {
        const { id } = req.params;
        const parsedID = Number(id);
        if (!Number.isInteger(parsedID) || parsedID <= 0) {
            res.status(400).json({ message: "Invalid profile ID" });
            return;
        }

        const data = await db.select().from(users).where(eq(users.id, parsedID));
        if (data.length === 0) {
            res.status(404).json({ message: "Profile not found" });
            return;
        }
        res.status(200).json(data[0]);
    })
);

// router.post(
//     "/",
//     asyncHandler(async (req, res, next) => {})
// );

export default router;
