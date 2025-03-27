import express from "express";
import db from "@/config/db/index.ts";
import { qpReviewRequests } from "@/config/db/schema/qp.ts";
import {
    applications,
    textFields,
    dateFields,
    fileFields,
} from "@/config/db/schema/form.ts";
import { checkAccess } from "@/middleware/auth.ts";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import { qpSchemas, modules } from "lib";
import { files } from "@/config/db/schema/form.ts";

const router = express.Router();

router.post(
    "/",
    checkAccess(),
    asyncHandler(async (req, res) => {
        const body = qpSchemas.qpRequestBodySchema.parse(req.body);
        const insertedIds: Record<string, number> = {};

        const inserted = await db.transaction(async (tx) => {
            const insertedApplication = await tx
                .insert(applications)
                .values({
                    module: modules[1],
                    userEmail: req.user!.email,
                    status: "pending",
                })
                .returning({ id: applications.id });

            const applicationId = insertedApplication[0].id;

            const bodyTextFields: [string, string | Date][] = Object.entries(
                body
            )
                .filter(([key, val]) => {
                    return (
                        typeof val === "string" &&
                        !["ficDeadline", "reviewDeadline"].includes(key)
                    );
                })
                .map(([key, value]) => [
                    key,
                    value ||
                        (key.startsWith("faculty")
                            ? `Placeholder ${key}`
                            : "N/A"),
                ]);

            if (bodyTextFields.length > 0) {
                const insertedTextFields = await tx
                    .insert(textFields)
                    .values(
                        bodyTextFields.map(([key, value]) => ({
                            value: value.toString(),
                            userEmail: req.user!.email,
                            module: modules[1],
                            fieldName: key,
                        }))
                    )
                    .returning({
                        id: textFields.id,
                        fieldName: textFields.fieldName,
                    });

                insertedTextFields.forEach((field) => {
                    if (field.fieldName) {
                        insertedIds[field.fieldName] = field.id;
                    }
                });
            }

            const dateFieldKeys: (keyof typeof body)[] = [
                "ficDeadline",
                "reviewDeadline",
            ];
            for (const key of dateFieldKeys) {
                if (body[key] && typeof body[key] === "string") {
                    const inserted = await tx
                        .insert(dateFields)
                        .values({
                            value: new Date(body[key]),
                            userEmail: req.user!.email,
                            module: modules[1],
                            fieldName: key,
                        })
                        .returning({ id: dateFields.id });

                    insertedIds[key] = inserted[0].id;
                }
            }

            const placeholderFile = await tx
                .insert(files)
                .values({
                    module: modules[1],
                    userEmail: req.user!.email,
                    filePath: "/uploads/placeholder.pdf",
                    originalName: "placeholder.pdf",
                    mimetype: "application/pdf",
                    size: 1024,
                })
                .returning({ id: files.id });

            const placeholderFileId = placeholderFile[0].id;

            const fileFieldKeys = [
                "midSem",
                "midSemSol",
                "compre",
                "compreSol",
            ];
            for (const key of fileFieldKeys) {
                const inserted = await tx
                    .insert(fileFields)
                    .values({
                        fileId: placeholderFileId,
                        module: modules[1],
                        userEmail: req.user!.email,
                        fieldName: key,
                    })
                    .returning({ id: fileFields.id });

                insertedIds[key] = inserted[0].id;
            }

            return await tx
                .insert(qpReviewRequests)
                .values({
                    applicationId,
                    dcaMember: insertedIds.dcaMember,
                    courseNo: insertedIds.courseNo,
                    courseName: insertedIds.courseName,
                    fic: insertedIds.fic,
                    ficDeadline: insertedIds.ficDeadline,
                    midSem: insertedIds.midSem,
                    midSemSol: insertedIds.midSemSol,
                    compre: insertedIds.compre,
                    compreSol: insertedIds.compreSol,
                    documentsUploaded: false,
                    faculty1: insertedIds.faculty1,
                    faculty2: insertedIds.faculty2,
                    reviewDeadline: insertedIds.reviewDeadline,
                })
                .returning();
        });

        res.status(201).json(inserted[0]);
    })
);

export default router;
