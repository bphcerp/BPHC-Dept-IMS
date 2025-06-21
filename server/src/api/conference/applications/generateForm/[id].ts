import { HttpCode, HttpError } from "@/config/errors.ts";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import express from "express";
import fs from "fs";
import crypto from "crypto";
import db from "@/config/db/index.ts";
import { generateApplicationFormPdf } from "@/lib/conference/form.ts";
import path from "path";
import environment, { FILES_DIR } from "@/config/environment.ts";
import { files } from "@/config/db/schema/form.ts";
import { modules } from "lib";
import { conferenceApprovalApplications } from "@/config/db/schema/conference.ts";
import { eq } from "drizzle-orm";
import { sendBulkEmails } from "@/lib/common/email.ts";
import { getApplicationById } from "@/lib/conference/index.ts";

const router = express.Router();

router.post(
    "/:id",
    asyncHandler(async (req, res, next) => {
        const id = parseInt(req.params.id);
        if (isNaN(id) || id <= 0)
            return next(new HttpError(HttpCode.BAD_REQUEST, "Invalid id"));

        const application = await getApplicationById(id);

        if (!application)
            return next(
                new HttpError(HttpCode.NOT_FOUND, "Application not found")
            );

        if (application.approvalFormFileId)
            return next(
                new HttpError(
                    HttpCode.BAD_REQUEST,
                    "This approval form has already been generated"
                )
            );

        if (application.state !== "Completed")
            return next(
                new HttpError(
                    HttpCode.BAD_REQUEST,
                    "This application is not in the accepted state"
                )
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
            await fs.promises.writeFile(filePath, fileBuffer);
            return inserted.id;
        });

        const mailData = {
            subject: `Conference Application ID ${application.id} - Approved`,
            html: `<p>Conference application ID <strong>${application.id}</strong> has been approved.</p>
               <p><a href="${environment.SERVER_URL}/f/${fileId}" style="display: inline-block; padding: 12px 24px; background-color: #007bff; color: white; text-decoration: none; border-radius: 4px; font-weight: 500;">View Application Form</a></p>`,
        };

        const emailsToSend = [
            {
                to: application.userEmail,
                ...mailData,
            },
        ];
        if (environment.DEPARTMENT_EMAIL)
            emailsToSend.push({
                to: environment.DEPARTMENT_EMAIL,
                ...mailData,
            });

        await sendBulkEmails(emailsToSend);
        res.status(200).send();
    })
);

export default router;
