import db from "@/config/db/index.ts";
//import { checkAccess } from "@/middleware/auth.ts";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import express from "express";

const router = express.Router();

router.get(
    "/",
    //checkAccess(),
    asyncHandler(async (_req, res, _next) => {
        const faculties = (
            await db.query.users.findMany({
                with: {
                    faculty: true,
                },
            })
        ).map((faculty) => {
            return {
                name: faculty.faculty.name,
                email: faculty.email,
                deactivated: faculty.deactivated,
            }
        });

        res.status(200).json({ success: true, faculties });
    })
);

export default router;
