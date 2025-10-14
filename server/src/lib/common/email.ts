import environment from "@/config/environment.ts";
import nodemailer, { type SendMailOptions } from "nodemailer";
import { Queue, Worker, QueueEvents } from "bullmq";
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

let testTransporter: nodemailer.Transporter | null = null;

if (!environment.PROD) {
    (async () => {
        const testAccount = await nodemailer.createTestAccount();
        testTransporter = nodemailer.createTransport({
            host: "smtp.ethereal.email",
            port: 587,
            secure: false, // true for 465, false for other ports
            auth: {
                user: testAccount.user, // generated ethereal user
                pass: testAccount.pass, // generated ethereal password
            },
        });
        logger.info(
            `Ethereal test account created. User: ${testAccount.user}, Pass: ${testAccount.pass}`
        );
    })();
}

const emailWorker = new Worker<SendMailOptions>(
    QUEUE_NAME,
    async (job) => {
        if (!environment.PROD) {
            if (!testTransporter) {
                logger.info(
                    `EMAIL JOB: ${job.id} - Test etherael account not created, skipped in non-production environment`
                );
                logger.debug(`Email data: ${JSON.stringify(job.data)}`);
                return
            }
            logger.info(
                `EMAIL JOB: ${job.id} - Using test ethereal account in development.`
            );

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

            const info = await testTransporter.sendMail({
                from: (testTransporter.options as any).auth?.user,
                ...mailOptions,
            });

            logger.info(
                `EMAIL JOB: ${job.id} - Email sent. View the ethereal mail here: ${nodemailer.getTestMessageUrl(info)}`
            );
            return info;
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

const emailQueueEvents = new QueueEvents(QUEUE_NAME, {
    connection: redisConfig,
    prefix: QUEUE_NAME,
});

export async function sendEmail(emailData: SendMailOptions) {
    const job = await emailQueue.add(JOB_NAME, emailData);
    const completedJob = await job.waitUntilFinished(emailQueueEvents);
    return completedJob;
}

export async function sendBulkEmails(emails: SendMailOptions[]) {
    if (!emails.length) return [];
    const jobs = emails.map((emailData) => ({
        name: JOB_NAME,
        data: emailData,
    }));

    return await emailQueue.addBulk(jobs);
}
