import express from "express";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import { checkAccess } from "@/middleware/auth.ts";
import db from "@/config/db/index.ts";
import { phd } from "@/config/db/schema/admin.ts";
import assert from "assert";
import {  sql } from "drizzle-orm";
const router = express.Router();

router.get(
    "/",
    checkAccess("phd-view-qualification-date"), 
    asyncHandler(async (req, res, ) => {
        assert(req.user);
        const userEmail = req.user.email; 

        
        const result = await db
            .select({ qualificationDate: phd.qualificationDate })
            .from(phd)
            .where(sql`${phd.email} = ${userEmail}`)
            .limit(1);

        if (!result.length) {
             res.status(404).json({
                success: false,
                message: "Qualification date not found for the user.",
            });
            return;
        }

        res.status(200).json({
            success: true,
            email: userEmail,
            qualificationDate: result[0].qualificationDate,
        });
    })
);

export default router;
