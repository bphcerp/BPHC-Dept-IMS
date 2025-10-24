import express from "express";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import { checkAccess } from "@/middleware/auth.ts";
import { modules, phdSchemas } from "lib"; // Import modules
import db from "@/config/db/index.ts";
import { sendBulkEmails } from "@/lib/common/email.ts";
import { createNotifications } from "@/lib/todos/index.ts"; // Import createNotifications

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
            // 1. Send Emails
            await sendBulkEmails(
                allUsers.map((user) => ({
                    to: user.email,
                    subject: subject,
                    text: body,
                }))
            );

            // 2. Send In-App Notifications
            await createNotifications(
                allUsers.map((user) => ({
                    userEmail: user.email,
                    module: modules[3], // PhD Proposal module
                    title: subject,
                    content: body,
                }))
            );
        }

        res.status(200).send();
    })
);

export default router;
