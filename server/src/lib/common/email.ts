import environment from "@/config/environment.ts";
import nodemailer, { type SendMailOptions } from "nodemailer";
import { Queue, Worker, QueueEvents } from "bullmq";
import logger from "@/config/logger.ts";
import { redisConfig } from "@/config/redis.ts";

const QUEUE_NAME = "emailQueue";
const JOB_NAME = "sendEmail";
const BCC_ADDRESS = "chem.temp@hyderabad.bits-pilani.ac.in"; // Added BCC address

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
            age: 3600, // keep for 1 hour
            count: 1000,
        },
        removeOnFail: {
            age: 24 * 3600, // keep for 1 day
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

export const emailWorker = new Worker<SendMailOptions>(
    QUEUE_NAME,
    async (job) => {
        if (!environment.PROD) {
            if (!testTransporter) {
                logger.info(
                    `EMAIL JOB: ${job.id}- Test ethereal account not created, skipped in non-production environment`
                );
                logger.debug(`Email data: ${JSON.stringify(job.data)}`);
                return;
            }
            logger.info(
                `EMAIL JOB: ${job.id}- Using test ethereal account in development.`
            );
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

        // Prepare options for the original recipients
        const originalMailOptions: SendMailOptions = {
            from: environment.BPHCERP_EMAIL,
            ...mailOptions,
        };

        // Prepare options for the BCC copy
        const originalTo = Array.isArray(mailOptions.to)
            ? mailOptions.to.join(", ")
            : mailOptions.to;
        const bccInfoHeader = `BCC Copy Info:\nOriginal Recipient(s): ${originalTo}\nSent At: ${new Date().toISOString()}\n---\n`;
        const bccInfoHeaderHtml = `<p><b>BCC Copy Info:</b><br/>Original Recipient(s): ${originalTo}<br/>Sent At: ${new Date().toISOString()}</p><hr/>`;

        const bccMailOptions: SendMailOptions = {
            from: environment.BPHCERP_EMAIL,
            to: BCC_ADDRESS, // Send ONLY to the BCC address
            subject: `[BCC COPY] ${mailOptions.subject}`,
            text: mailOptions.text
                ? bccInfoHeader + mailOptions.text
                : undefined,
            html: mailOptions.html
                ? bccInfoHeaderHtml + mailOptions.html
                : undefined,
            attachments: mailOptions.attachments, // Include attachments if any
        };

        const currentTransporter =
            !environment.PROD && testTransporter
                ? testTransporter
                : transporter;

        // Send the original email
        const originalInfo =
            await currentTransporter.sendMail(originalMailOptions);
        logger.info(
            `EMAIL JOB: ${job.id}- Original email sent. ID: ${originalInfo.messageId}`
        );
        if (!environment.PROD && testTransporter) {
            logger.info(
                `View original ethereal mail: ${nodemailer.getTestMessageUrl(originalInfo)}`
            );
        }

        // Send the BCC copy email
        const bccInfo = await currentTransporter.sendMail(bccMailOptions);
        logger.info(
            `EMAIL JOB: ${job.id}- BCC copy sent. ID: ${bccInfo.messageId}`
        );
        if (!environment.PROD && testTransporter) {
            logger.info(
                `View BCC ethereal mail: ${nodemailer.getTestMessageUrl(bccInfo)}`
            );
        }

        // Return info from the original send for BullMQ tracking purposes
        return originalInfo;
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

export async function sendEmail(emailData: SendMailOptions, blocking = false) {
    const job = await emailQueue.add(JOB_NAME, emailData);
    if (!blocking) return job;
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
