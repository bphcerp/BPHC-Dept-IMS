import express from "express";
import db from "@/config/db/index.ts";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import { eq } from "drizzle-orm";
import { faculty, phd, staff, users } from "@/config/db/schema/admin.ts";
import { HttpCode, HttpError } from "@/config/errors.ts";
import { checkAccess } from "@/middleware/auth.ts";
import { adminSchemas } from "lib";

const router = express.Router();

router.post(
    "/",
    checkAccess(),
    asyncHandler(async (req, res, next) => {
        const parsed = adminSchemas.deactivateMemberBodySchema.parse(req.body);
        const user = await db.query.users.findFirst({
            where: eq(users.email, parsed.email),
        });
        if (!user)
            return next(new HttpError(HttpCode.NOT_FOUND, "User not found"));
        const table =
            user.type === adminSchemas.userTypes[0]
                ? faculty
                : user.type === adminSchemas.userTypes[1]
                  ? phd
                  : staff;
        await db.delete(table).where(eq(table.email, parsed.email));
        await db.delete(users).where(eq(users.email, parsed.email));
        res.status(HttpCode.OK).send();
    })
);

export default router;
