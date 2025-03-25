import db from "@/config/db/index.ts";
import { courseHandoutRequests } from "@/config/db/schema/handout.ts";
import { HttpCode, HttpError } from "@/config/errors.ts";
import { checkAccess } from "@/middleware/auth.ts";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import express from "express";
import { handoutSchemas } from "lib";

const router = express.Router();

router.post(
    "/",
    checkAccess("dca-assign-ics"),
    asyncHandler(async (req, res, next) => {
        const parsed = handoutSchemas.assignICBodySchema.parse(req.body);

        const icExists = db.query.users.findFirst({
            where: (user, { eq }) => eq(user.email, parsed.icEmail),
        });

        if (!icExists) {
            return next(new HttpError(HttpCode.NOT_FOUND, "IC does not exist"));
        }

        await db.insert(courseHandoutRequests).values({
            icEmail: parsed.icEmail,
            courseCode: parsed.courseCode,
            courseName: parsed.courseName,
        });

        res.status(201).json({ success: true });
    })
);

export default router;
