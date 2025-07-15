import { Request, Response } from "express";
import db from "@/config/db/index.ts";
import { checkAccess } from "@/middleware/auth.ts";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import express from "express";
import { wilpProject } from "@/config/db/schema/wilpProject.ts";
import { eq } from "drizzle-orm";

const router = express.Router();

router.get(
    "/",
    checkAccess("wilp:project:view-selected"),
    asyncHandler(async (req: Request, res: Response) => {
        if (!req.user?.email) {
            res.status(400).json({ error: "User email not found" });
            return;
        }
        let data = await db
            .select()
            .from(wilpProject)
            .where(eq(wilpProject.facultyEmail, req.user.email))
            .orderBy(wilpProject.studentId);
        res.json(data);
    })
);

export default router;
