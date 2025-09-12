import express from "express";
import db from "@/config/db/index.ts";
import { checkAccess } from "@/middleware/auth.ts";
import { asyncHandler } from "@/middleware/routeHandler.ts";
const router = express.Router();

router.get(
    "/",
    checkAccess(),
    asyncHandler(async (_req, res) => {
        const forms = await db.query.allocationForm.findMany({
            with: {
                createdBy: {
                    columns: {
                        name: true,
                        email: true,
                    },
                },
                template: {
                    columns: {
                        id: true,
                        name: true,
                    },
                },
            },
        });
        res.status(200).json(forms);
    })
);

export default router;
