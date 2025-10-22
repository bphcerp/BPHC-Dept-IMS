#!/usr/bin/env node

import app from "./app.ts";
import env from "./config/environment.ts";
import logger from "./config/logger.ts";

import {
    scheduleDailyProposalReminders,
    proposalReminderWorker,
} from "./lib/jobs/proposalReminderJobs.ts";
import { emailWorker } from "./lib/common/email.ts";

logger.info("Initializing BullMQ Workers...");
emailWorker.on("ready", () => logger.info("Email worker ready."));
proposalReminderWorker.on("ready", () =>
    logger.info("Proposal reminder worker ready.")
);

try {
    scheduleDailyProposalReminders().catch((err) => {
        logger.error("Failed to schedule daily proposal reminders:", err);
    });
} catch (error) {
    logger.error("Error during initial job scheduling:", error);
}

app.set("port", env.SERVER_PORT);

app.listen(env.SERVER_PORT, () => {
    logger.info(`Server started on port ${env.SERVER_PORT}`);
});
