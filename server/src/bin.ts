#!/usr/bin/env node

import app from "./app.ts";
import env from "./config/environment.ts";
import logger from "./config/logger.ts";

import {
    scheduleHourlyProposalReminders,
    proposalReminderWorker,
} from "./lib/jobs/proposalReminderJobs.ts";
import { emailWorker } from "./lib/common/email.ts";

emailWorker.on("error", (_error) => {});
proposalReminderWorker.on("error", (_error) => {});

try {
    scheduleHourlyProposalReminders().catch((_err) => {});
} catch (error: any) {}

app.set("port", env.SERVER_PORT);

app.listen(env.SERVER_PORT, () => {
    logger.info(`Server started on port ${env.SERVER_PORT}`);
});
