import express from "express";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import { checkAccess } from "@/middleware/auth.ts";
import db from "@/config/db/index.ts";
import { phd } from "@/config/db/schema/admin.ts";
import {
    applications,
    files,
    fileFields,
    textFields,
} from "@/config/db/schema/form.ts";
import { todos, notifications } from "@/config/db/schema/todos.ts";
import { eq } from "drizzle-orm";
import assert from "assert";
import { phdSchemas } from "lib";
import { pdfUpload } from "@/config/multer.ts";
import multer from "multer";
import { HttpCode, HttpError } from "@/config/errors.ts";
import { modules } from "lib";
import type { Request, Response, NextFunction } from "express";
import { createNotifications, createTodos } from "@/lib/todos/index.ts";

const router = express.Router();

router.post(
    "/",
    checkAccess(),
    asyncHandler(async (req: Request, res: Response, next: NextFunction) =>
        pdfUpload.fields([
            { name: "proposalDocument1", maxCount: 1 },
            { name: "proposalDocument2", maxCount: 1 },
            { name: "proposalDocument3", maxCount: 1 },
        ])(req, res, (err) => {
            if (err instanceof multer.MulterError)
                return next(new HttpError(HttpCode.BAD_REQUEST, err.message));
            next(err);
        })
    ),
    asyncHandler(async (req, res) => {
        assert(req.user);

        const uploadedFiles = req.files as
            | Record<string, Express.Multer.File[]>
            | undefined;

        if (
            !uploadedFiles?.proposalDocument1 ||
            !uploadedFiles.proposalDocument2 ||
            !uploadedFiles.proposalDocument3
        ) {
            throw new HttpError(
                HttpCode.BAD_REQUEST,
                "All three proposal documents are required"
            );
        }

        const { email } = req.user;

        // Get student name for notifications
        const student = await db.query.phd.findFirst({
            where: eq(phd.email, email),
            columns: {
                name: true,
            },
        });

        const studentName = student?.name ?? email;

        const parsed = phdSchemas.uploadProposalSchema.safeParse({
            ...req.body,
            fileUrl1: uploadedFiles.proposalDocument1[0].path,
            fileUrl2: uploadedFiles.proposalDocument2[0].path,
            fileUrl3: uploadedFiles.proposalDocument3[0].path,
            formName1: uploadedFiles.proposalDocument1[0].originalname,
            formName2: uploadedFiles.proposalDocument2[0].originalname,
            formName3: uploadedFiles.proposalDocument3[0].originalname,
        });

        if (!parsed.success) {
            throw new HttpError(HttpCode.BAD_REQUEST, "Invalid input data");
        }

        const { supervisor, coSupervisor1, coSupervisor2 } = parsed.data;

        await db.transaction(async (tx) => {
            // Insert application
            const [application] = await tx
                .insert(applications)
                .values({
                    module: modules[3],
                    userEmail: email,
                    status: "pending",
                })
                .returning();

            const fileEntries = [
                {
                    field: "proposalDocument1",
                    file: uploadedFiles.proposalDocument1[0],
                },
                {
                    field: "proposalDocument2",
                    file: uploadedFiles.proposalDocument2[0],
                },
                {
                    field: "proposalDocument3",
                    file: uploadedFiles.proposalDocument3[0],
                },
            ];

            for (const { field, file } of fileEntries) {
                const [fileRecord] = await tx
                    .insert(files)
                    .values({
                        userEmail: email,
                        filePath: file.path,
                        originalName: file.originalname,
                        mimetype: file.mimetype,
                        size: file.size,
                        fieldName: field,
                        module: modules[3],
                    })
                    .returning();

                await tx.insert(fileFields).values({
                    fileId: fileRecord.id,
                    module: modules[3],
                    userEmail: email,
                    fieldName: field,
                });
            }

            await tx.insert(textFields).values([
                {
                    value: supervisor,
                    userEmail: email,
                    module: modules[3],
                    fieldName: "supervisor",
                },
                {
                    value: coSupervisor1,
                    userEmail: email,
                    module: modules[3],
                    fieldName: "coSupervisor1",
                },
                {
                    value: coSupervisor2,
                    userEmail: email,
                    module: modules[3],
                    fieldName: "coSupervisor2",
                },
            ]);

            await tx
                .update(phd)
                .set({
                    supervisorEmail: supervisor,
                    coSupervisorEmail: coSupervisor1,
                    coSupervisorEmail2: coSupervisor2,
                })
                .where(eq(phd.email, email));

            // Create notification for supervisor
            await createNotifications([
                {
                    module: "PhD Proposal",
                    title: "New PhD Thesis Proposal Submission",
                    content: `${studentName} (${email}) has submitted their PhD thesis proposal documents for your review. Please review the documents at your earliest convenience.`,
                    userEmail: supervisor,
                    link: `/phd/proposals/${application.id}`,
                },
            ]);

            // Create todo for supervisor
            await createTodos([
                {
                    module: "PhD Proposal",
                    title: "Review PhD Thesis Proposal",
                    description: `Review the thesis proposal submitted by ${studentName} (${email}). The proposal includes three documents that require your evaluation.`,
                    link: "/supervised-students",
                    assignedTo: supervisor,
                    createdBy: email,
                    completionEvent: "proposal_approval_" + application.id,
                },
            ]);
        });

        res.status(HttpCode.OK).json({
            success: true,
            message: "Proposal documents uploaded successfully",
        });
    })
);

export default router;
