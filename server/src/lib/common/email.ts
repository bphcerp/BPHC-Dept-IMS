import environment from "@/config/environment.ts";
import nodemailer, { type SendMailOptions } from "nodemailer";
import { type ConnectionOptions, Queue, Worker } from "bullmq";
import logger from "@/config/logger.ts";

const QUEUE_NAME = "emailQueue";

const redisConfig: ConnectionOptions = {
    host: environment.REDIS_HOST,
    port: environment.REDIS_PORT,
    password: environment.REDIS_PASSWORD,
    maxRetriesPerRequest: null,
    enableReadyCheck: true,
};

const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: environment.BPHCERP_EMAIL,
        pass: environment.BPHCERP_PASSWORD,
    },
});

const emailQueue = new Queue(QUEUE_NAME, {
    connection: redisConfig,
    defaultJobOptions: {
        attempts: 2,
        backoff: {
            type: "exponential",
            delay: 10000,
        },
        removeOnComplete: {
            age: 3600,
            count: 1000,
        },
        removeOnFail: {
            age: 24 * 3600,
            count: 5000,
        },
    },
    prefix: QUEUE_NAME,
});

const emailWorker = new Worker<Omit<SendMailOptions, "from">>(
    QUEUE_NAME,
    async (job) => {
        return await transporter.sendMail({
            from: environment.BPHCERP_EMAIL,
            ...job.data,
        });
    },
    {
        connection: redisConfig,
        concurrency: 10,
        prefix: QUEUE_NAME,
    }
);

emailWorker.on("failed", (job, err) => {
    logger.error(`Email job failed: ${job?.id}`, err);
});

export async function sendEmail(emailData: Omit<SendMailOptions, "from">) {
    return await emailQueue.add("sendEmail", emailData);
}

export async function sendBulkEmails(emails: Omit<SendMailOptions, "from">[]) {
    const jobs = emails.map((emailData, index) => ({
        name: "sendEmail", // Same name for all - this is fine!
        data: emailData,
        opts: {
            delay: index * 100,
        },
    }));

    return await emailQueue.addBulk(jobs);
}
