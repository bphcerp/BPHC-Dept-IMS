import express from "express";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import { checkAccess } from "@/middleware/auth.ts";
import { modules, phdSchemas } from "lib";
import { createNotifications } from "@/lib/todos/index.ts";
import db from "@/config/db/index.ts";
import { sendBulkEmails } from "@/lib/common/email.ts";

const router = express.Router();

router.post(
    "/",
    checkAccess(),
    asyncHandler(async (req, res) => {
        const { subject, body } = phdSchemas.notifyDeadlinePayloadSchema.parse(
            req.body
        );

        const allPhdStudents = await db.query.phd.findMany({
            columns: { email: true },
        });
        const allFaculty = await db.query.faculty.findMany({
            columns: { email: true },
        });

        const allUsers = [...allPhdStudents, ...allFaculty];

        if (allUsers.length > 0) {
            await createNotifications(
                allUsers.map((user) => ({
                    userEmail: user.email,
                    module: modules[3], 
                    title: subject,
                    content: body,
                }))
            );

            await sendBulkEmails(
                allUsers.map((user) => ({
                    to: user.email,
                    subject: subject,
                    text: body,
                }))
            );
        }

        res.status(200).send();
    })
);

export default router;
