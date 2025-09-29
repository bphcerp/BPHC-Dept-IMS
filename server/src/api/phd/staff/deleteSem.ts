import express from "express";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import { checkAccess } from "@/middleware/auth.ts";
import db from "@/config/db/index.ts";
import { phdSemesters } from "@/config/db/schema/phd.ts";
import { eq } from "drizzle-orm";

const router = express.Router();

router.delete(
    "/:id",
    checkAccess(),
    asyncHandler(async (req, res) => {
        const id = Number.parseInt(req.params.id);
        await db.delete(phdSemesters).where(eq(phdSemesters.id, id));
        res.status(200).send();
    })
);

export default router;
