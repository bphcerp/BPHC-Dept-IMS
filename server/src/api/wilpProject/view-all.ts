import { Request, Response } from "express";
import db from "@/config/db/index.ts";
import { checkAccess } from "@/middleware/auth.ts";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import express from "express";
import { wilpProject } from "@/config/db/schema/wilpProject.ts";
import { isNull } from "drizzle-orm";

const router = express.Router();

router.get(
    "/",
    checkAccess("wilp:project:view-all"),
    asyncHandler(async (_req: Request, res: Response) => {
        let data = await db
            .select()
            .from(wilpProject)
            .where(isNull(wilpProject.facultyEmail))
            .orderBy(wilpProject.studentId);
        res.json(data);
    })
);

export default router;
