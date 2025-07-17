import { Request, Response } from "express";
import db from "@/config/db/index.ts";
import { checkAccess } from "@/middleware/auth.ts";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import express from "express";
import { wilpProject } from "@/config/db/schema/wilpProject.ts";

const router = express.Router();

router.delete(
    "/",
    checkAccess("wilp:project:clear"),
    asyncHandler(async (_req: Request, res: Response) => {
        let data = await db.delete(wilpProject);
        if (data && data.rowCount) {
            res.json({
                message: `Removed ${data.rowCount} Wilp Projects`,
            });
        } else {
            res.status(404).json({
                message: "No Wilp Projects found to clear",
            });
        }
    })
);

export default router;
