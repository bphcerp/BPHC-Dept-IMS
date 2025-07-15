import db from "@/config/db/index.ts";
import { fileFields, files } from "@/config/db/schema/form.ts";
import { courseHandoutRequests } from "@/config/db/schema/handout.ts";
import { HttpCode, HttpError } from "@/config/errors.ts";
import { pdfUpload } from "@/config/multer.ts";
import {
    completeTodo,
    createNotifications,
    createTodos,
} from "@/lib/todos/index.ts";
import { checkAccess } from "@/middleware/auth.ts";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import assert from "assert";
import { eq } from "drizzle-orm";
import express from "express";
import { handoutSchemas, modules } from "lib";
import multer from "multer";

const router = express.Router();

router.post(
    "/",
    checkAccess(),
    asyncHandler(async (req, res, next) =>
        pdfUpload.single("handout")(req, res, (err) => {
            if (err instanceof multer.MulterError)
                return next(new HttpError(HttpCode.BAD_REQUEST, err.message));
            next(err);
        })
    ),
    asyncHandler(async (req, res, next) => {
        if (!req.file) {
            return next(
                new HttpError(HttpCode.BAD_REQUEST, "No File Uploaded")
            );
        }

        const { id } = handoutSchemas.submitHandoutQuerySchema.parse(req.query);
        const { openBook, midSem, compre, otherEvals } =
            handoutSchemas.handoutUploadBodySchema.parse(req.body);

        await db.transaction(async (tx) => {
            assert(req.user);
            const insertedFile = await tx
                .insert(files)
                .values({
                    userEmail: req.user.email,
                    filePath: req.file!.path,
                    originalName: req.file!.originalname,
                    mimetype: req.file!.mimetype,
                    size: req.file!.size,
                    fieldName: "handout",
                    module: modules[1],
                })
                .returning();

            const insertedFileField = await tx
                .insert(fileFields)
                .values({
                    module: modules[1],
                    userEmail: req.user.email,
                    fileId: insertedFile[0].id,
                    fieldName: "handout",
                })
                .returning();

            const handouts = await tx
                .update(courseHandoutRequests)
                .set({
                    handoutFilePath: insertedFileField[0].id,
                    openBook,
                    midSem,
                    compre,
                    otherEvals,
                    submittedOn: new Date(),
                    status: "review pending",
                })
                .where(eq(courseHandoutRequests.id, Number(id)))
                .returning();
            if (handouts.length > 0) {
                await completeTodo({
                    module: "Course Handout",
                    assignedTo: req.user.email,
                    completionEvent: `handout submission ${handouts[0].courseCode} by ${handouts[0].icEmail}`,
                });

                if (handouts[0].reviewerEmail) {
                    await createTodos([
                        {
                            module: "Course Handout",
                            title: "Course Handout Review",
                            description: `Review handout for the ${handouts[0].courseName} (Course Code : ${handouts[0].courseCode})`,
                            assignedTo: handouts[0].reviewerEmail,
                            link: "/handout/dca",
                            completionEvent: `handout review ${handouts[0].courseCode} by ${handouts[0].reviewerEmail}`,
                            createdBy: req.user.email,
                        },
                    ]);

                    await createNotifications([
                        {
                            module: "Course Handout",
                            title: "Course Handout Review",
                            content: `Handout for the ${handouts[0].courseName} (Course Code : ${handouts[0].courseCode}) has been submitted`,
                            userEmail: handouts[0].reviewerEmail,
                            link: "/handout/dca",
                        },
                    ]);
                }
            }
        });
        res.status(201).json({ success: true });
    })
);

export default router;
