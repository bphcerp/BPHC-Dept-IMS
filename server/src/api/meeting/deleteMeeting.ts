// server/src/api/meeting/deleteMeeting.ts
import express from "express";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import { checkAccess } from "@/middleware/auth.ts";
import db from "@/config/db/index.ts";
import { meetings } from "@/config/db/schema/meeting.ts";
import { eq, and } from "drizzle-orm";
import { HttpError, HttpCode } from "@/config/errors.ts";
import { completeTodo } from "@/lib/todos/index.ts";
import { sendBulkEmails } from "@/lib/common/email.ts";
import { modules } from "lib";

const router = express.Router();

router.delete(
    "/:id",
    checkAccess(),
    asyncHandler(async (req, res) => {
        const meetingId = parseInt(req.params.id, 10);
        const organizerEmail = req.user!.email;

        const meeting = await db.query.meetings.findFirst({
            where: and(
                eq(meetings.id, meetingId),
                eq(meetings.organizerEmail, organizerEmail)
            ),
            with: {
                participants: true,
            },
        });

        if (!meeting) {
            throw new HttpError(
                HttpCode.FORBIDDEN,
                "You are not the organizer of this meeting."
            );
        }

        await db
            .update(meetings)
            .set({ status: "cancelled" })
            .where(eq(meetings.id, meetingId));

        await completeTodo({
            module: modules[11],
            completionEvent: `meeting:rsvp:${meetingId}`,
        });

        const allParticipants = meeting.participants.map(
            (p) => p.participantEmail
        );
        if (allParticipants.length > 0) {
            const subject = `Meeting Cancelled: ${meeting.title}`;
            const description = `The meeting "${meeting.title}" scheduled by ${organizerEmail} has been cancelled.`;
            await sendBulkEmails(
                allParticipants.map((email) => ({
                    to: email,
                    subject,
                    text: description,
                }))
            );
        }

        res.status(200).json({
            success: true,
            message: "Meeting has been cancelled.",
        });
    })
);

export default router;
