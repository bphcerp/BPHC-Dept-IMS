import express from "express";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import { checkAccess } from "@/middleware/auth.ts";
import { modules, phdSchemas } from "lib";
import { createNotifications } from "@/lib/todos/index.ts";
import db from "@/config/db/index.ts";
import { sendEmail } from "@/lib/common/email.ts";
import environment from "@/config/environment.ts";
import { marked } from "marked";
import DOMPurify from "isomorphic-dompurify";

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

        const emailBody = DOMPurify.sanitize(marked(body));

        if (allUsers.length > 0) {
            // 1. Send Emails
            await sendEmail({
                to: environment.DEPARTMENT_EMAIL,
                bcc: allUsers.map((user) => user.email),
                subject: subject,
                html: emailBody,
            });

            // 2. Send In-App Notifications
            await createNotifications(
                allUsers.map((user) => ({
                    userEmail: user.email,
                    module: modules[4], // PhD QE
                    title: subject,
                    content: body,
                }))
            );
        }

        res.status(200).send();
    })
);

export default router;
