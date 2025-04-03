import db from "@/config/db/index.ts";
import { courseHandoutRequests } from "@/config/db/schema/handout.ts";
import { HttpCode, HttpError } from "@/config/errors.ts";
// import { checkAccess } from "@/middleware/auth.ts";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import express from "express";
import { handoutSchemas } from "lib";
import { eq } from "drizzle-orm";

const router = express.Router();

router.post(
    "/",
    // checkAccess("dca-assign-ics"),
    asyncHandler(async (req, res, next) => {
        const parsed = handoutSchemas.updateICBodySchema.parse(req.body);
        const icExists = await db.query.users.findFirst({
            where: (user, { eq }) => eq(user.email, parsed.icEmail),
        });
        if (!icExists) {
            return next(new HttpError(HttpCode.NOT_FOUND, "IC does not exist"));
        }
        const handoutExists = await db.query.courseHandoutRequests.findFirst({
            where: (handout, { eq }) => eq(handout.id, Number(parsed.id)),
        });
        if (!handoutExists) {
            return next(
                new HttpError(HttpCode.NOT_FOUND, "Handout does not exist")
            );
        }
        await db
            .update(courseHandoutRequests)
            .set({
                icEmail: parsed.icEmail,
            })
            .where(eq(courseHandoutRequests.id, Number(parsed.id)))
            .returning();
        res.status(200).json({ success: true });
    })
);

export default router;
