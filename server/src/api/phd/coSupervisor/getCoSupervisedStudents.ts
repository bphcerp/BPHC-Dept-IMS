import express from "express";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import { checkAccess } from "@/middleware/auth.ts";
import db from "@/config/db/index.ts";
import { phd } from "@/config/db/schema/admin.ts";
import { phdDocuments } from "@/config/db/schema/phd.ts";
import { eq } from "drizzle-orm";
import assert from "assert";

const router = express.Router();

export default router.get(
    "/",
    checkAccess(),
    asyncHandler(async (req, res) => {
        assert(req.user);
        const coSupervisorEmail = req.user.email;  

        const students = await db
            .select({
                email: phd.email,
                name: phd.name,
                documents: phdDocuments.fileUrl
            })
            .from(phd)
            .leftJoin(phdDocuments, eq(phd.email, phdDocuments.email))
            .where(eq(phd.coSupervisorEmail, coSupervisorEmail))

        res.status(200).json({ success: true, students });
    })
);
