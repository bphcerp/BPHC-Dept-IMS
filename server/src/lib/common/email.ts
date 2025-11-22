import environment from "@/config/environment.ts";
import nodemailer, { type SendMailOptions } from "nodemailer";
import { Queue, Worker, QueueEvents } from "bullmq";
import logger from "@/config/logger.ts";
import { redisConfig } from "@/config/redis.ts";

const QUEUE_NAME = "emailQueue";
const JOB_NAME = "sendEmail";
const BCC_ADDRESS = "chem.temp@hyderabad.bits-pilani.ac.in";

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
        attempts: 3,
        backoff: {
            type: "exponential",
            delay: 15000,
        },
        removeOnComplete: {
            age: 5 * 24 * 3600,
            count: 1000,
        },
        removeOnFail: {
            age: 5 * 24 * 3600,
            count: 5000,
        },
    },
    prefix: QUEUE_NAME,
});

let testTransporter: nodemailer.Transporter | null = null;
if (!environment.PROD) {
    (async () => {
        try {
            const testAccount = await nodemailer.createTestAccount();
            testTransporter = nodemailer.createTransport({
                host: "smtp.ethereal.email",
                port: 587,
                secure: false,
                auth: {
                    user: testAccount.user,
                    pass: testAccount.pass,
                },
            });
            logger.info(
                `Ethereal test account created. User: ${testAccount.user}, Pass: ${testAccount.pass}`
            );
        } catch (error) {
            logger.error("Failed to create Ethereal test account:", error);
        }
    })();
}

export const emailWorker = new Worker<SendMailOptions & { body?: string }>( // Allow 'body' property
    QUEUE_NAME,
    async (job) => {
        const isDevelopment = !environment.PROD;
        const currentTransporter =
            isDevelopment && testTransporter ? testTransporter : transporter;

        if (isDevelopment && !testTransporter) {
            logger.info(
                `EMAIL JOB: ${job.id} - Test transporter not ready, skipped in non-production.`
            );
            logger.debug(`Email data: ${JSON.stringify(job.data)}`);
            return;
        }

        if (!currentTransporter) {
            logger.error(
                `EMAIL JOB: ${job.id} - Transporter is not available.`
            );
            throw new Error("Email transporter not configured.");
        }

        const { from, body, ...mailOptions } = { ...job.data };
        const footerText =
            "\n\n---\nThis is an auto-generated email from ims. Please do not reply." +
            (from ? `\nSent by: ${from}` : "");
        const footerHtml =
            "<br><br><hr><p><i>This is an auto-generated email from ims. Please do not reply.</i>" +
            (from ? `<br /><i>Sent by: ${from}</i>` : "") +
            "</p>";

        if (!mailOptions.text && !mailOptions.html && body) {
            mailOptions.text = body;
        }
        const mailOptionsWithDefaults: SendMailOptions = {
            from: `${environment.DEPARTMENT_NAME_FULL} ${environment.BPHCERP_EMAIL}`,
            ...mailOptions,
            text: mailOptions.text
                ? `${mailOptions.text}${footerText}`
                : undefined,
            html: mailOptions.html
                ? `${mailOptions.html}${footerHtml}`
                : undefined,
            bcc: [mailOptions.bcc, BCC_ADDRESS].filter(Boolean).join(", "),
        };

        if (!mailOptionsWithDefaults.bcc) {
            delete mailOptionsWithDefaults.bcc;
        }

        try {
            const info = await currentTransporter.sendMail(
                mailOptionsWithDefaults
            );
            logger.info(
                `EMAIL JOB: ${job.id} - Email sent. ID: ${info.messageId}`
            );
            if (isDevelopment && testTransporter) {
                logger.info(
                    `View ethereal mail: ${nodemailer.getTestMessageUrl(info)}`
                );
            }
            return info;
        } catch (error) {
            logger.error(`EMAIL JOB: ${job.id} - Failed to send email:`, error);
            throw error;
        }
    },
    {
        connection: redisConfig,
        concurrency: 5,
        prefix: QUEUE_NAME,
    }
);

emailWorker.on("failed", (job, err) => {
    logger.error(
        `Email job ${job?.id} failed after ${job?.attemptsMade} attempts: ${err.message}`,
        err
    );
});
emailWorker.on("error", (err) => {
    logger.error("Email worker encountered an error:", err);
});

const emailQueueEvents = new QueueEvents(QUEUE_NAME, {
    connection: redisConfig,
    prefix: QUEUE_NAME,
});

export async function sendEmail(emailData: SendMailOptions, blocking = false) {
    const job = await emailQueue.add(JOB_NAME, emailData);
    if (!blocking) return job;

    try {
        const result = await job.waitUntilFinished(emailQueueEvents, 30000);
        return result;
    } catch (error) {
        logger.error(`Error waiting for email job ${job.id} to finish:`, error);
        throw error;
    }
}

export async function sendBulkEmails(
    emails: (SendMailOptions & { body?: string })[]
) {
    if (!emails.length) return [];
    const jobs = emails.map((emailData) => ({
        name: JOB_NAME,
        data: emailData,
    }));
    return await emailQueue.addBulk(jobs);
}
