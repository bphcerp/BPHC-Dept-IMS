import express from "express";
import db from "@/config/db/index.ts";
import { checkAccess } from "@/middleware/auth.ts";
import { asyncHandler } from "@/middleware/routeHandler.ts";
const router = express.Router();

router.get(
    "/",
    checkAccess(),
    asyncHandler(async (req, res) => {
        const templates = await db.query.allocationFormTemplate.findMany({
            with: {
                createdBy: {
                    columns: {
                        name: true,
                        email: true,
                    },
                },
            }
        });
        res.status(200).json(templates);
    })
);

export default router;
