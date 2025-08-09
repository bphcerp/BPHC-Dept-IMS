import express from "express";
import { z } from "zod";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import { checkAccess } from "@/middleware/auth.ts";
import db from "@/config/db/index.ts";
import { HttpError, HttpCode } from "@/config/errors.ts";
import { users } from "@/config/db/schema/admin.ts";
import { eq } from "drizzle-orm";
import env from "@/config/environment.ts";
import { marked } from "marked";
import DOMPurify from "isomorphic-dompurify";
import { sendEmail } from "@/lib/common/email.ts";

const router = express.Router();

const notifyUsersSchema = z.object({
    subject: z.string(),
    body: z.string(),
});

router.post(
    "/",
    checkAccess(),
    asyncHandler(async (req, res) => {
        const { subject, body } = notifyUsersSchema.parse(req.body);
        const htmlBody = DOMPurify.sanitize(marked(body));

        const allUsers = await db
            .select({
                email: users.email,
                type: users.type,
            })
            .from(users)
            .where(eq(users.deactivated, false));

        if (allUsers.length === 0) {
            throw new HttpError(HttpCode.NOT_FOUND, "No users found");
        }

        const userEmails = allUsers.map((user) => user.email);

        await sendEmail({
            subject,
            html: htmlBody,
            to: env.BPHCERP_EMAIL,
            bcc: userEmails,
        });

        res.status(200).send();
    })
);

export default router;
