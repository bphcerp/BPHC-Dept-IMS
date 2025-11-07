import { getApplicationById, getApplicationWithFilePaths } from "./index.ts";
import fs from "fs/promises";
import path from "path";
import {
    encodeImageToBase64,
    getUserDetails,
    getUsersWithPermission,
} from "../common/index.ts";
import environment, { STATIC_DIR, FILES_DIR } from "@/config/environment.ts";
import { generateTemplateData } from "./templateGenerator.ts";
import Mustache from "mustache";
import db from "@/config/db/index.ts";
import { modules, type allPermissions } from "lib";
import { HttpCode, HttpError } from "@/config/errors.ts";
import pdf from "html-pdf-node";
import crypto from "crypto";
import { files } from "@/config/db/schema/form.ts";
import { conferenceApprovalApplications } from "@/config/db/schema/conference.ts";
import { eq } from "drizzle-orm";
import { sendEmail } from "../common/email.ts";
import { Queue, Worker } from "bullmq";
import { redisConfig } from "@/config/redis.ts";
import logger from "@/config/logger.ts";

const QUEUE_NAME = "conferenceFormQueue";

const formQueue = new Queue(QUEUE_NAME, {
    connection: redisConfig,
    defaultJobOptions: {
        attempts: 1,
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

const formWorker = new Worker<number>(
    QUEUE_NAME,
    async (job) => {
        return await processGenerateAndMailForm(job.data);
    },
    {
        connection: redisConfig,
        concurrency: 1,
        prefix: QUEUE_NAME,
    }
);

formWorker.on("failed", (job, err) => {
    logger.error(`Conference form job failed: ${job?.id}`, err);
});

export const bulkGenerateAndMailForms = async (ids: number[]) => {
    if (!ids.length) return [];
    return await formQueue.addBulk(
        ids.map((id) => ({
            name: "generateAndMailConferenceForm",
            data: id,
        }))
    );
};

export const generateAndMailForm = async (id: number) => {
    return await formQueue.add("generateAndMailConferenceForm", id);
};

export const processGenerateAndMailForm = async (id: number) => {
    const application = await getApplicationById(id);

    if (!application)
        throw new HttpError(HttpCode.NOT_FOUND, "Application not found");

    if (application.approvalFormFileId)
        throw new HttpError(
            HttpCode.BAD_REQUEST,
            "This approval form has already been generated"
        );

    if (application.state !== "Completed")
        throw new HttpError(
            HttpCode.BAD_REQUEST,
            "This application is not in the accepted state"
        );

    const fileBuffer = await generateApplicationFormPdf(application.id);
    const fileName = crypto.randomBytes(16).toString("hex");
    const filePath = path.join(FILES_DIR, fileName);

    const fileId = await db.transaction(async (tx) => {
        const inserted = (
            await tx
                .insert(files)
                .values({
                    originalName: `conference-approval-form-${application.id}.pdf`,
                    size: fileBuffer.length,
                    mimetype: "application/pdf",
                    module: modules[0],
                    filePath,
                })
                .returning()
        )[0];
        await tx
            .update(conferenceApprovalApplications)
            .set({ approvalFormFileId: inserted.id })
            .where(eq(conferenceApprovalApplications.id, application.id));
        await fs.writeFile(filePath, fileBuffer);
        return inserted.id;
    });

    void sendEmail({
        to: environment.DEPARTMENT_EMAIL
            ? [environment.DEPARTMENT_EMAIL, application.userEmail]
            : application.userEmail,
        subject: `Conference Application ID ${application.id} - Approved`,
        html: `<p>Conference application ID <strong>${application.id}</strong> has been approved.</p>
                   <p><a href="${environment.SERVER_URL}/f/${fileId}" style="display: inline-block; padding: 12px 24px; background-color: #007bff; color: white; text-decoration: none; border-radius: 4px; font-weight: 500;">View Application Form</a></p>`,
    });
};

export const generateApplicationFormPdf = async (
    id: number
): Promise<Buffer> => {
    const html = await generateApplicationFormHtml(id);
    return await (pdf.generatePdf(
        { content: html },
        {
            format: "A4",
            margin: {
                top: "20mm",
                right: "20mm",
                bottom: "20mm",
                left: "20mm",
            },
            printBackground: true,
        }
    ) as unknown as Promise<Buffer>);
};

const generateApplicationFormHtml = async (id: number): Promise<string> => {
    const applicationData = await getApplicationWithFilePaths(id);
    if (!applicationData)
        throw new HttpError(HttpCode.NOT_FOUND, "Application not found");
    if (!(applicationData.state === "Completed"))
        throw new HttpError(
            HttpCode.BAD_REQUEST,
            "Application is not approved"
        );
    const userData = await getUserDetails(applicationData.userEmail);
    if (!userData)
        throw new HttpError(
            HttpCode.INTERNAL_SERVER_ERROR,
            "User not found",
            "Unable to retrieve user details for the application"
        );
    const drcReviews = (
        await db.query.conferenceApplicationMembers.findMany({
            columns: {
                reviewStatus: true,
            },
            where: (cols, { eq }) => eq(cols.applicationId, applicationData.id),
        })
    )
        .map((review) => review.reviewStatus)
        .filter((status) => status !== null);

    const {
        signatureBase64: drcConvenerSignatureBase64,
        approvalDate: convenerDate,
        name: convenerName,
    } = await getAuthorityDetails(
        applicationData.id,
        "conference:application:convener"
    );

    const {
        signatureBase64: hodSignatureBase64,
        approvalDate: hodDate,
        name: hodName,
    } = await getAuthorityDetails(
        applicationData.id,
        "conference:application:hod"
    );

    const logoBase64 = await encodeImageToBase64({
        filePath: path.join(STATIC_DIR, "logo.svg"),
    });

    const templatePath = path.join(
        STATIC_DIR,
        "conferenceApprovalTemplate.html"
    );
    const template = await fs.readFile(templatePath, "utf-8");

    const data = generateTemplateData({
        ...userData, // user data has to be spread first as both userData and applicationData
        // have description field and we want the one from applicationData to override userData
        ...applicationData,
        drcReviews,
        logoBase64,
        drcConvenerSignatureBase64,
        convenerDate,
        convenerName,
        hodSignatureBase64,
        hodDate,
        hodName,
    });

    return Mustache.render(template, data);
};

const getAuthorityDetails = async (
    applicationId: number,
    permission: keyof typeof allPermissions
): Promise<{
    signatureBase64: string | undefined;
    approvalDate: string | undefined;
    name: string | undefined;
}> => {
    const user = (await getUsersWithPermission(permission))[0];
    if (!user)
        return {
            signatureBase64: undefined,
            approvalDate: undefined,
            name: undefined,
        };
    const faculty = await db.query.faculty.findFirst({
        columns: { name: true },
        with: {
            signatureFile: true,
        },
        where: (cols, { eq }) => eq(cols.email, user.email),
    });
    const signatureBase64 = faculty?.signatureFile
        ? await encodeImageToBase64(faculty.signatureFile)
        : undefined;
    const approvalDate = (
        await db.query.conferenceStatusLog.findFirst({
            columns: { timestamp: true },
            where: (cols, { eq, and }) =>
                and(
                    eq(cols.applicationId, applicationId),
                    eq(cols.userEmail, user.email)
                ),
            orderBy: (cols, { desc }) => desc(cols.timestamp),
        })
    )?.timestamp.toLocaleDateString();
    const name = user.name ?? undefined;
    return { signatureBase64, approvalDate, name };
};
