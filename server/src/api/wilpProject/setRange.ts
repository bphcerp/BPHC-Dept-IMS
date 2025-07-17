import { Request, Response } from "express";
import db from "@/config/db/index.ts";
import { checkAccess } from "@/middleware/auth.ts";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import express from "express";
import { wilpProjectsRange } from "@/config/db/schema/wilpProject.ts";
import { wilpProjectSchemas } from "lib";

const router = express.Router();

router.post(
    "/",
    checkAccess("wilp:project:upload"),
    asyncHandler(async (req: Request, res: Response) => {
        let { min, max } =
            wilpProjectSchemas.wilpProjectSetRangeBodySchema.parse(req.body);

        if (max < min) {
            res.status(400).json({
                error: "Maximum must be greater than or equal to minimum.",
            });
            return;
        }

        await db.delete(wilpProjectsRange);
        let data = await db.insert(wilpProjectsRange).values({
            min,
            max,
        });

        if (!data) {
            res.status(500).json({
                error: "Failed to set project selection range. Please try again.",
            });
            return;
        }
        
        res.json({
            message: `Project selection range (${min} - ${max}) set successfully.`,
        });
    })
);

export default router;
