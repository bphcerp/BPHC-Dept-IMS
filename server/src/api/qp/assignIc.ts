import db from "@/config/db/index.ts";
import { qpReviewRequests } from "@/config/db/schema/qp.ts";
import { HttpCode, HttpError } from "@/config/errors.ts";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import express from "express";
import { qpSchemas } from "lib";

const router = express.Router();

router.post(
    "/",
    asyncHandler(async (req, res, next) => {
        console.log(req.body)
        const parsed = qpSchemas.assignICBodySchema.parse(req.body);

        const icExists = await db.query.users.findFirst({
            where: (user, { eq }) => eq(user.email, parsed.icEmail),
        });

        if (!icExists) {
            return next(new HttpError(HttpCode.NOT_FOUND, "IC does not exist"));
        }

        await db.insert(qpReviewRequests).values({
            icEmail: parsed.icEmail,
            courseCode: parsed.courseCode,
            courseName: parsed.courseName,
            category: parsed.category,
        });

        res.status(201).json({ success: true });
    })
);

export default router;
