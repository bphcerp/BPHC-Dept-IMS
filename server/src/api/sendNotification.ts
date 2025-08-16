import express from "express";
import{asyncHandler}from "@/middleware/routeHandler.ts";
import{checkAccess}from "@/middleware/auth.ts";
import{phdSchemas}from "lib";
import{createNotifications, createTodos}from "@/lib/todos/index.ts";
import{sendBulkEmails}from "@/lib/common/email.ts";
import{HttpError, HttpCode}from "@/config/errors.ts";
import assert from "assert";
import{marked}from "marked";
import DOMPurify from "isomorphic-dompurify";
import db from "@/config/db/index.ts";
import{users}from "@/config/db/schema/admin.ts";
import{inArray}from "drizzle-orm";

const router = express.Router();

router.post(
  "/",
  checkAccess(),
  asyncHandler(async(req, res)=>{
    assert(req.user, "User must be defined");
    const{subject, body, channels, recipients, link}= phdSchemas.notificationPayloadSchema.parse(req.body);

    if(recipients.length === 0){
      throw new HttpError(HttpCode.BAD_REQUEST, "No recipients provided.");
    }
    if(!channels.email && !channels.notification && !channels.todo){
      throw new HttpError(HttpCode.BAD_REQUEST, "At least one notification channel must be selected.");
    }

    // Filter recipients to find who is a registered user
    const registeredUsers = await db.select({email: users.email}).from(users).where(inArray(users.email, recipients));
    const registeredRecipientEmails = registeredUsers.map((u)=> u.email);

    const htmlBody = DOMPurify.sanitize(marked(body));

    if(channels.email){
      // Emails can be sent to everyone (internal and external)
      const emailJobs = recipients.map((recipient)=>({
        to: recipient,
        subject,
        html: htmlBody,
      }));
      await sendBulkEmails(emailJobs);
    }

    if(channels.notification){
      // In-app notifications can only be created for registered users
      const notificationJobs = registeredRecipientEmails.map((recipient)=>({
        userEmail: recipient,
        title: subject,
        content: body,
        module: "PhD Qe Application" as const,
        link,
      }));
      if(notificationJobs.length > 0){
        await createNotifications(notificationJobs);
      }
    }

    if(channels.todo){
      // To-dos can only be assigned to registered users
      const todoJobs = registeredRecipientEmails.map((recipient)=>({
        assignedTo: recipient,
        createdBy: req.user!.email,
        title: subject,
        description: body,
        module: "PhD Qe Application" as const,
        completionEvent: `manual_task_${new Date().getTime()}`,
        link,
      }));
      if(todoJobs.length > 0){
        await createTodos(todoJobs);
      }
    }

    res.status(200).json({success: true, message: "Notifications sent."});
  }),
);

export default router;