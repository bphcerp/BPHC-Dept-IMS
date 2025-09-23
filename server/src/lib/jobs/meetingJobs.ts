// server/src/lib/jobs/meetingJobs.ts
import { Queue, Worker } from "bullmq";
import { redisConfig } from "@/config/redis.ts";
import logger from "@/config/logger.ts";
import db from "@/config/db/index.ts";
import { meetings, finalizedMeetingSlots } from "@/config/db/schema/meeting.ts";
import { eq, and } from "drizzle-orm";
import { createNotifications, completeTodo } from "@/lib/todos/index.ts";
import { sendEmail, sendBulkEmails } from "@/lib/common/email.ts";
import { modules } from "lib";

const QUEUE_NAME = "meetingQueue";

interface DeadlineJobData {
    type: "deadline";
    meetingId: number;
}
interface SlotJobData {
    type: "reminder" | "completion";
    finalizedSlotId: number;
}
type JobData = DeadlineJobData | SlotJobData;

export const meetingQueue = new Queue<JobData>(QUEUE_NAME, {
    connection: redisConfig,
    defaultJobOptions: {
        attempts: 3,
        backoff: {
            type: "exponential",
            delay: 10000,
        },
        removeOnComplete: {
            age: 3600 * 24,
        },
        removeOnFail: {
            age: 3600 * 24 * 7,
        },
    },
});

const meetingWorker = new Worker<JobData>(
    QUEUE_NAME,
    async (job) => {
        const { type } = job.data;

        if (type === "deadline") {
            const { meetingId } = job.data;
            const meeting = await db.query.meetings.findFirst({
                where: eq(meetings.id, meetingId),
            });
            if (!meeting || meeting.status !== "pending_responses") {
                logger.info(
                    `Deadline job ${job.id} for meeting ${meetingId} skipped (not pending responses).`
                );
                return;
            }
            await db
                .update(meetings)
                .set({ status: "awaiting_finalization" })
                .where(eq(meetings.id, meetingId));
            const subject = `Response deadline reached for: ${meeting.title}`;
            const content = `The response deadline for the meeting "${meeting.title}" has passed. Please finalize the meeting time.`;
            await createNotifications([
                {
                    userEmail: meeting.organizerEmail,
                    title: subject,
                    content,
                    module: modules[11],
                },
            ]);
            await sendEmail({
                to: meeting.organizerEmail,
                subject,
                text: content,
            });
            return;
        }

        // Logic for reminder and completion jobs
        const { finalizedSlotId } = job.data;
        const slot = await db.query.finalizedMeetingSlots.findFirst({
            where: eq(finalizedMeetingSlots.id, finalizedSlotId),
            with: { meeting: { with: { participants: true } } },
        });
        if (!slot || !slot.meeting || slot.meeting.status === "cancelled") {
            logger.info(
                `Job ${job.id} for finalized slot ${finalizedSlotId} skipped (slot/meeting not found or cancelled).`
            );
            return;
        }
        const { meeting } = slot;

        switch (type) {
            case "reminder":
                if (meeting.status === "scheduled") {
                    const allAttendees = [
                        meeting.organizerEmail,
                        ...meeting.participants.map((p) => p.participantEmail),
                    ];
                    const subject = `Reminder: Meeting starting soon - ${meeting.title}`;
                    const description = `This is a reminder that the meeting "${meeting.title}" is scheduled to start in 15 minutes at ${slot.startTime.toLocaleTimeString()}.`;
                    await sendBulkEmails(
                        allAttendees.map((email) => ({
                            to: email,
                            subject,
                            text: description,
                        }))
                    );
                }
                break;
            case "completion":
                if (meeting.status === "scheduled") {
                    // Remove the day-of todo for this specific slot
                    await completeTodo({
                        module: modules[11],
                        completionEvent: `meeting:day-of:${finalizedSlotId}`,
                    });

                    // Check if all slots for this meeting are done, then mark meeting as completed.
                    const remainingSlots = await db
                        .select({ id: finalizedMeetingSlots.id })
                        .from(finalizedMeetingSlots)
                        .where(
                            and(
                                eq(finalizedMeetingSlots.meetingId, meeting.id),
                                eq(finalizedMeetingSlots.endTime, slot.endTime)
                            )
                        );

                    if (remainingSlots.length === 0) {
                        await db
                            .update(meetings)
                            .set({ status: "completed" })
                            .where(eq(meetings.id, meeting.id));
                    }
                }
                break;
        }
    },
    { connection: redisConfig, concurrency: 5 }
);

meetingWorker.on("failed", (job, err) => {
    logger.error(`Meeting job ${job?.id} failed with error: ${err.message}`);
});

export async function scheduleDeadlineJob(meetingId: number, deadline: Date) {
    const delay = deadline.getTime() - Date.now();
    if (delay > 0) {
        await meetingQueue.add(
            "deadlineJob",
            { type: "deadline", meetingId },
            { delay }
        );
    }
}

export async function schedulePreMeetingReminder(
    finalizedSlotId: number,
    startTime: Date
) {
    const delay = startTime.getTime() - Date.now() - 15 * 60 * 1000;
    if (delay > 0) {
        await meetingQueue.add(
            "reminderJob",
            { type: "reminder", finalizedSlotId },
            { delay }
        );
    }
}

export async function scheduleCompletionJob(
    finalizedSlotId: number,
    endTime: Date
) {
    // Job runs 1 hour after the meeting ends
    const delay = endTime.getTime() - Date.now() + 60 * 60 * 1000;
    if (delay > 0) {
        await meetingQueue.add(
            "completionJob",
            { type: "completion", finalizedSlotId },
            { delay }
        );
    }
}
