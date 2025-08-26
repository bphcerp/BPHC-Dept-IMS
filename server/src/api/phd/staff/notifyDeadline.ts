import express from "express";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import { checkAccess } from "@/middleware/auth.ts";
import { phdSchemas } from "lib";
import { createNotifications, createTodos } from "@/lib/todos/index.ts";
import { sendBulkEmails } from "@/lib/common/email.ts";
import { HttpError, HttpCode } from "@/config/errors.ts";
import assert from "assert";
import { marked } from "marked";
import DOMPurify from "isomorphic-dompurify";
import db from "@/config/db/index.ts";
import { users } from "@/config/db/schema/admin.ts";
import { inArray } from "drizzle-orm";

const router = express.Router();

router.post(
  "/",
  checkAccess(),
  asyncHandler(async (req, res) => {
    assert(req.user, "User must be defined");
    const { subject, body, channels, recipients, link } =
      phdSchemas.notificationPayloadSchema.parse(req.body);

    // --- THIS IS THE FIX ---
    // The error happens because `recipients` can be `undefined`.
    // This corrected check first ensures `recipients` exists, and then checks if it's empty.
    // This satisfies the TypeScript compiler and prevents runtime errors.
    if (!recipients || recipients.length === 0) {
      throw new HttpError(HttpCode.BAD_REQUEST, "No recipients provided.");
    }

    if (!channels.email && !channels.notification && !channels.todo) {
      throw new HttpError(
        HttpCode.BAD_REQUEST,
        "At least one notification channel must be selected.",
      );
    }

    // After the check above, TypeScript knows `recipients` is a valid array.
    const registeredUsers = await db
      .select({ email: users.email })
      .from(users)
      .where(inArray(users.email, recipients));
    const registeredRecipientEmails = registeredUsers.map((u) => u.email);

    const htmlBody = DOMPurify.sanitize(marked(body));

    if (channels.email) {
      const emailJobs = recipients.map((recipient) => ({
        to: recipient,
        subject,
        html: htmlBody,
      }));
      await sendBulkEmails(emailJobs);
    }

    if (channels.notification && registeredRecipientEmails.length > 0) {
      const notificationJobs = registeredRecipientEmails.map((recipient) => ({
        userEmail: recipient,
        title: subject,
        content: body,
        module: "PhD Qe Application" as const,
        link,
      }));
      await createNotifications(notificationJobs);
    }

    if (channels.todo && registeredRecipientEmails.length > 0) {
      const todoJobs = registeredRecipientEmails.map((recipient) => ({
        assignedTo: recipient,
        createdBy: req.user!.email,
        title: subject,
        description: body,
        module: "PhD Qe Application" as const,
        completionEvent: `manual_task_${new Date().getTime()}`,
        link,
      }));
      await createTodos(todoJobs);
    }

    res.status(200).json({ success: true, message: "Notifications sent." });
  }),
);

export default router;