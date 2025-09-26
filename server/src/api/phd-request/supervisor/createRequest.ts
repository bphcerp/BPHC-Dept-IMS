// server/src/api/phd-request/supervisor/createRequest.ts
import { asyncHandler } from "@/middleware/routeHandler.ts";
import { checkAccess } from "@/middleware/auth.ts";
import express from "express";
import db from "@/config/db/index.ts";
import { pdfUpload } from "@/config/multer.ts";
import { phdRequestSchemas, modules } from "lib";
import { HttpError, HttpCode } from "@/config/errors.ts";
import {
    phdRequests,
    phdRequestDocuments,
} from "@/config/db/schema/phdRequest.ts";
import { files } from "@/config/db/schema/form.ts";
import { createTodos } from "@/lib/todos/index.ts";
import { getUsersWithPermission } from "@/lib/common/index.ts";
import { eq } from "drizzle-orm";
import { phd } from "@/config/db/schema/admin.ts";

const router = express.Router();

router.post(
    "/",
    checkAccess(),
    pdfUpload.array("documents", 5),
    asyncHandler(async (req, res) => {
        const { studentEmail, requestType, comments } =
            phdRequestSchemas.createRequestSchema.parse(req.body);
        const supervisorEmail = req.user!.email;
        const uploadedFiles = req.files as Express.Multer.File[];

        if (!uploadedFiles || uploadedFiles.length === 0) {
            throw new HttpError(
                HttpCode.BAD_REQUEST,
                "At least one document is required."
            );
        }

        const latestSemester = await db.query.phdSemesters.findFirst({
            orderBy: (table, { desc }) => [
                desc(table.year),
                desc(table.semesterNumber),
            ],
        });

        if (!latestSemester) {
            throw new HttpError(
                HttpCode.BAD_REQUEST,
                "No active semester found."
            );
        }

        const newRequestId = await db.transaction(async (tx) => {
            const [newRequest] = await tx
                .insert(phdRequests)
                .values({
                    studentEmail,
                    supervisorEmail,
                    semesterId: latestSemester.id,
                    requestType,
                    status: "supervisor_submitted",
                    comments: comments, // Using the comments variable
                })
                .returning({ id: phdRequests.id });

            const fileInserts = uploadedFiles.map((file) => ({
                userEmail: supervisorEmail,
                filePath: file.path,
                originalName: file.originalname,
                mimetype: file.mimetype,
                size: file.size,
                fieldName: file.fieldname,
                module: modules[2], // PhD Module
            }));

            const insertedFiles = await tx
                .insert(files)
                .values(fileInserts)
                .returning();

            const documentInserts = insertedFiles.map((file) => ({
                requestId: newRequest.id,
                fileId: file.id,
                uploadedByEmail: supervisorEmail,
                documentType: requestType, // Simplified, could be more granular
                isPrivate: false,
            }));

            await tx.insert(phdRequestDocuments).values(documentInserts);

            return newRequest.id;
        });

        const drcConveners = await getUsersWithPermission(
            "phd-request:drc-convener:view"
        );
        const student = await db.query.phd.findFirst({
            where: eq(phd.email, studentEmail),
            columns: { name: true },
        });

        if (drcConveners.length > 0) {
            await createTodos(
                drcConveners.map((convener) => ({
                    assignedTo: convener.email,
                    createdBy: supervisorEmail,
                    title: `New PhD Request from ${student?.name || studentEmail}`,
                    description: `A new '${requestType.replace(/_/g, " ")}' request has been submitted by the supervisor.`,
                    module: modules[2],
                    completionEvent: `phd-request:drc-convener-review:${newRequestId}`,
                    link: `/phd/drc-convener/requests/${newRequestId}`,
                }))
            );
        }

        res.status(201).json({
            success: true,
            message: "Request submitted successfully.",
            requestId: newRequestId,
        });
    })
);

export default router;
