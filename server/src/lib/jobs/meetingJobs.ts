// server/src/lib/jobs/meetingJobs.ts
import { Queue, Worker } from "bullmq";
import { redisConfig } from "@/config/redis.ts";
import logger from "@/config/logger.ts";
import db from "@/config/db/index.ts";
import { meetings } from "@/config/db/schema/meeting.ts";
import { eq } from "drizzle-orm";
import { createNotifications, completeTodo } from "@/lib/todos/index.ts";
import { sendEmail, sendBulkEmails } from "@/lib/common/email.ts";
import { modules } from "lib";

const QUEUE_NAME = "meetingQueue";

interface JobData {
    type: "deadline" | "reminder" | "completion";
    meetingId: number;
}

export const meetingQueue = new Queue<JobData>(QUEUE_NAME, {
    connection: redisConfig,
    defaultJobOptions: {
        attempts: 3,
        backoff: {
            type: "exponential",
            delay: 10000,
        },
        removeOnComplete: {
            age: 3600 * 24, // keep for 1 day
        },
        removeOnFail: {
            age: 3600 * 24 * 7, // keep for 7 days
        },
    },
});

const meetingWorker = new Worker<JobData>(
    QUEUE_NAME,
    async (job) => {
        const { type, meetingId } = job.data;
        const meeting = await db.query.meetings.findFirst({
            where: eq(meetings.id, meetingId),
            with: { participants: true },
        });

        if (
            !meeting ||
            meeting.status === "cancelled" ||
            meeting.status === "completed"
        ) {
            logger.info(
                `Job ${job.id} for meeting ${meetingId} skipped (meeting cancelled, completed, or not found).`
            );
            return;
        }

        switch (type) {
            case "deadline":
                if (meeting.status === "pending_responses") {
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
                }
                break;
            case "reminder":
                if (meeting.status === "scheduled" && meeting.finalizedTime) {
                    const allAttendees = [
                        meeting.organizerEmail,
                        ...meeting.participants.map((p) => p.participantEmail),
                    ];

                    const subject = `Reminder: Meeting starting soon - ${meeting.title}`;
                    const description = `This is a reminder that the meeting "${
                        meeting.title
                    }" is scheduled to start in 15 minutes at ${meeting.finalizedTime.toLocaleTimeString()}.`;

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
                    await db
                        .update(meetings)
                        .set({ status: "completed" })
                        .where(eq(meetings.id, meetingId));
                    await completeTodo({
                        module: modules[11],
                        completionEvent: `meeting:finalized:${meetingId}`,
                    });
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
    meetingId: number,
    startTime: Date
) {
    const delay = startTime.getTime() - Date.now() - 15 * 60 * 1000; // 15 minutes before
    if (delay > 0) {
        await meetingQueue.add(
            "reminderJob",
            { type: "reminder", meetingId },
            { delay }
        );
    }
}

export async function scheduleCompletionJob(meetingId: number, endTime: Date) {
    const delay = endTime.getTime() - Date.now() + 60 * 60 * 1000; // 1 hour after
    if (delay > 0) {
        await meetingQueue.add(
            "completionJob",
            { type: "completion", meetingId },
            { delay }
        );
    }
}
