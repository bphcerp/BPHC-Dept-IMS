import db from "@/config/db/index.ts";
import { notifications } from "@/config/db/schema/todos.ts";
import { HttpCode, HttpError } from "@/config/errors.ts";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import { eq } from "drizzle-orm";
import express from "express";
const router = express.Router();

router.post(
    "/",
    asyncHandler(async (req, res, next) => {
        if (!req.user) {
            return next(
                new HttpError(HttpCode.UNAUTHORIZED, "User not authenticated")
            );
        }
        await db
            .delete(notifications)
            .where(eq(notifications.userEmail, req.user.email));
        res.status(HttpCode.OK).send();
    })
);

export default router;
