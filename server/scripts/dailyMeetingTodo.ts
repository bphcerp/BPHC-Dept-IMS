// server/scripts/dailyMeetingTodo.ts
import db from "@/config/db/index.ts";
import { finalizedMeetingSlots } from "@/config/db/schema/meeting.ts";
import { and, gte, lte } from "drizzle-orm";
import { createTodos } from "@/lib/todos/index.ts";
import { modules } from "lib";
import logger from "@/config/logger.ts";

// Manual implementation of date-fns functions
const startOfDay = (date: Date): Date => {
    const newDate = new Date(date);
    newDate.setHours(0, 0, 0, 0);
    return newDate;
};

const endOfDay = (date: Date): Date => {
    const newDate = new Date(date);
    newDate.setHours(23, 59, 59, 999);
    return newDate;
};

async function createDailyMeetingTodos() {
    logger.info("Running job: createDailyMeetingTodos");
    const now = new Date();
    const todayStart = startOfDay(now);
    const todayEnd = endOfDay(now);

    const todaysSlots = await db.query.finalizedMeetingSlots.findMany({
        where: and(
            gte(finalizedMeetingSlots.startTime, todayStart),
            lte(finalizedMeetingSlots.startTime, todayEnd)
        ),
        with: {
            meeting: {
                with: {
                    participants: true,
                },
            },
        },
    });

    if (todaysSlots.length === 0) {
        logger.info("No meetings scheduled for today.");
        return;
    }

    const todosToCreate = [];
    for (const slot of todaysSlots) {
        const meeting = slot.meeting;
        if (!meeting) continue;

        const allAttendees = [
            meeting.organizerEmail,
            ...meeting.participants.map((p) => p.participantEmail),
        ];
        // Use a Set to handle cases where organizer might also be a participant
        const uniqueAttendees = [...new Set(allAttendees)];

        for (const userEmail of uniqueAttendees) {
            todosToCreate.push({
                assignedTo: userEmail,
                createdBy: "system",
                title: `Meeting Today: ${meeting.title} at ${slot.startTime.toLocaleTimeString()}`,
                description: `This meeting is scheduled for today. Venue: ${
                    slot.venue || "N/A"
                }, Link: ${slot.googleMeetLink || "N/A"}`,
                module: modules[11],
                completionEvent: `meeting:day-of:${slot.id}`,
                link: `/meeting/view/${meeting.id}`,
            });
        }
    }

    if (todosToCreate.length > 0) {
        await createTodos(todosToCreate);
        logger.info(
            `Created ${todosToCreate.length} To-Dos for meetings scheduled today.`
        );
    } else {
        logger.info("No new To-Dos needed for today's meetings.");
    }
}

createDailyMeetingTodos()
    .catch((e) => {
        logger.error("Error in createDailyMeetingTodos job:", e);
    })
    .finally(() => {
        process.exit(0);
    });
