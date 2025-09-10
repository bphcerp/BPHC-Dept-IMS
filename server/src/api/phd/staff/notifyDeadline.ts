import express from "express";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import { checkAccess } from "@/middleware/auth.ts";
import { modules, phdSchemas } from "lib";
import { createNotifications } from "@/lib/todos/index.ts";
import db from "@/config/db/index.ts";

const router = express.Router();

router.post(
    "/",
    checkAccess(),
    asyncHandler(async (req, res) => {
        const { subject, body } = phdSchemas.notifyDeadlinePayloadSchema.parse(
            req.body
        );

        const users = await db.query.users.findMany({
            columns: { email: true },
        });

        await createNotifications(
            users.map((user) => ({
                userEmail: user.email,
                module: modules[4],
                title: subject,
                content: body,
            }))
        );

        res.status(200).send();
    })
);

export default router;
