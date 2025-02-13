import express from "express";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import { checkAccess } from "@/middleware/auth.ts";
import db from "@/config/db/index.ts";
import { phd } from "@/config/db/schema/admin.ts";
import { eq } from "drizzle-orm";
import assert from "assert";

const router = express.Router();

router.get(
    "/",
    checkAccess("notional-supervisor-view-phd"),
    asyncHandler(async (req, res) => {
        assert(req.user);

        const phdRecords = await db
            .select({
                name: phd.name,
                email: phd.email,
            })
            .from(phd)
            .where(eq(phd.notionalSupervisorEmail, req.user.email));

        res.json({ success: true, phdRecords });
    })
);

export default router;
