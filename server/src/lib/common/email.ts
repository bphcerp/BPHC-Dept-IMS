import environment from "@/config/environment.ts";
import nodemailer, { type SendMailOptions } from "nodemailer";
import { Queue, Worker } from "bullmq";
import logger from "@/config/logger.ts";
import { redisConfig } from "@/config/redis.ts";

const QUEUE_NAME = "emailQueue";
const JOB_NAME = "sendEmail";

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

const emailWorker = new Worker<SendMailOptions>(
    QUEUE_NAME,
    async (job) => {
        if (!environment.PROD) {
            logger.info(
                `EMAIL JOB: ${job.id} - Skipped in non-production environment`
            );
            logger.debug(`Email data: ${JSON.stringify(job.data)}`);
            return;
        }

        const { from, ...mailOptions } = { ...job.data };

        const footerText =
            "\n\n---\nThis is an auto-generated email from ims. Please do not reply." +
            (from ? `\nSent by: ${from}` : "");
        const footerHtml =
            "<br><br><hr><p><i>This is an auto-generated email from ims. Please do not reply.</i>" +
            (from ? `<br /><i>Sent by: ${from}</i>` : "") +
            "</p>";

        if (mailOptions.text) {
            mailOptions.text = `${mailOptions.text}${footerText}`;
        }
        if (mailOptions.html && typeof mailOptions.html === "string") {
            mailOptions.html = `${mailOptions.html}${footerHtml}`;
        }

        return await transporter.sendMail({
            from: environment.BPHCERP_EMAIL,
            ...mailOptions,
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

export async function sendEmail(emailData: SendMailOptions) {
    return await emailQueue.add(JOB_NAME, emailData);
}

export async function sendBulkEmails(emails: SendMailOptions[]) {
    if (!emails.length) return [];
    const jobs = emails.map((emailData) => ({
        name: JOB_NAME,
        data: emailData,
    }));

    return await emailQueue.addBulk(jobs);
}
