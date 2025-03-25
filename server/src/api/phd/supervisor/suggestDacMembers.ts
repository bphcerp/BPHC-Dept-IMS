import express from "express";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import { checkAccess } from "@/middleware/auth.ts";
import db from "@/config/db/index.ts";
import { phd } from "@/config/db/schema/admin.ts";
import { eq } from "drizzle-orm";
import assert from "assert";
import { phdSchemas } from "lib";

const router = express.Router();

router.post(
    "/",
    checkAccess(),
    asyncHandler(async (req, res) => {
        assert(req.user);
        const parsed = phdSchemas.suggestDacMembersSchema.parse(req.body);
        
        const { dacMembers } = parsed; 
        const email = req.user.email;

        await db
            .update(phd)
            .set({ suggestedDacMembers: dacMembers }) 
            .where(eq(phd.email, email));

        res.status(200).json({ success: true, message: "Suggested DAC members stored successfully" });
    })
);

export default router;