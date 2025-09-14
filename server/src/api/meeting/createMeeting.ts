// server/src/api/meeting/createMeeting.ts
import express from "express";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import { checkAccess } from "@/middleware/auth.ts";
import db from "@/config/db/index.ts";
import {
    meetings,
    meetingParticipants,
    meetingTimeSlots,
} from "@/config/db/schema/meeting.ts";
import { meetingSchemas } from "lib";
import { createTodos } from "@/lib/todos/index.ts";
import { sendBulkEmails } from "@/lib/common/email.ts";
import environment from "@/config/environment.ts";
import { scheduleDeadlineJob } from "@/lib/jobs/meetingJobs.ts";

const router = express.Router();

router.post(
    "/",
    checkAccess(),
    asyncHandler(async (req, res) => {
        const body = meetingSchemas.createMeetingSchema.parse(req.body);
        const organizerEmail = req.user!.email;

        const { meetingId } = await db.transaction(async (tx) => {
            const [newMeeting] = await tx
                .insert(meetings)
                .values({
                    title: body.title,
                    purpose: body.purpose,
                    duration: body.duration,
                    organizerEmail,
                    deadline: new Date(body.deadline),
                    status: "pending_responses",
                })
                .returning({ id: meetings.id });

            const meetingId = newMeeting.id;

            await tx.insert(meetingParticipants).values(
                body.participants.map((email) => ({
                    meetingId,
                    participantEmail: email,
                }))
            );

            await tx.insert(meetingTimeSlots).values(
                body.timeSlots.map((slot) => {
                    const startTime = new Date(slot);
                    const endTime = new Date(
                        startTime.getTime() + body.duration * 60000
                    );
                    return {
                        meetingId,
                        startTime,
                        endTime,
                    };
                })
            );

            const todoTitle = `RSVP for meeting: ${body.title}`;
            const todoDescription = `You have been invited to a meeting by ${organizerEmail}. Please provide your availability.`;
            const deadlineDate = new Date(body.deadline);

            await createTodos(
                body.participants.map((email) => ({
                    assignedTo: email,
                    createdBy: organizerEmail,
                    title: todoTitle,
                    description: todoDescription,
                    module: "Meeting" as any,
                    completionEvent: `meeting:rsvp:${meetingId}`,
                    link: `/meeting/respond/${meetingId}`,
                    deadline: deadlineDate,
                })),
                tx
            );

            await sendBulkEmails(
                body.participants.map((email) => ({
                    to: email,
                    subject: `Meeting Invitation: ${body.title}`,
                    html: `<p>${todoDescription}</p><p>Please respond by ${deadlineDate.toLocaleString()}.</p><p><a href="${
                        environment.FRONTEND_URL
                    }/meeting/respond/${meetingId}">Click here to respond</a>.</p>`,
                }))
            );

            // Schedule job for when the deadline passes
            await scheduleDeadlineJob(meetingId, deadlineDate);

            return { meetingId };
        });

        res.status(201).json({
            success: true,
            message: "Meeting created successfully.",
            meetingId,
        });
    })
);

export default router;
