import express from "express";
import db from "@/config/db/index.ts";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import { eq } from "drizzle-orm";
import { users } from "@/config/db/schema/admin.ts";
import { HttpCode } from "@/config/errors.ts";
import { checkAccess } from "@/middleware/auth.ts";
import { adminSchemas } from "lib";

const router = express.Router();

router.post(
    "/",
    checkAccess(),
    asyncHandler(async (req, res) => {
        const parsed = adminSchemas.deactivateMemberBodySchema.parse(req.body);
        await db.delete(users).where(eq(users.email, parsed.email));
        res.status(HttpCode.OK).send();
    })
);

export default router;
