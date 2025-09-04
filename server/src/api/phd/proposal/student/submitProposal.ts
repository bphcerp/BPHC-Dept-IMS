import db from "@/config/db/index.ts";
import { phdProposals } from "@/config/db/schema/phd.ts";
import { files } from "@/config/db/schema/form.ts";
import { HttpCode, HttpError } from "@/config/errors.ts";
import { pdfUpload } from "@/config/multer.ts";
import { checkAccess } from "@/middleware/auth.ts";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import express from "express";
import { modules, phdSchemas } from "lib";
import multer from "multer";
import assert from "assert";
import { createTodos } from "@/lib/todos/index.ts";

const router = express.Router();

router.post(
    "/",
    checkAccess(),
    asyncHandler((req, res) =>
        pdfUpload.fields(phdSchemas.phdProposalMulterFileFields)(
            req,
            res,
            (err) => {
                if (err instanceof multer.MulterError)
                    throw new HttpError(HttpCode.BAD_REQUEST, err.message);
                throw err;
            }
        )
    ),
    asyncHandler(async (req, res) => {
        const { title } = phdSchemas.phdProposalSubmissionSchema.parse(
            req.body
        );
        const student = await db.query.phd.findFirst({
            where: (cols, { eq }) => eq(cols.email, req.user!.email),
        });
        assert(student, "PhD student record not found");
        // TODO: check other eligibility criteria
        const supervisorEmail = student.notionalSupervisorEmail;
        if (!supervisorEmail || !supervisorEmail.trim().length)
            throw new HttpError(
                HttpCode.BAD_REQUEST,
                "Notional supervisor not assigned"
            );
        if (Array.isArray(req.files))
            throw new HttpError(HttpCode.BAD_REQUEST, "Invalid files");
        if (!req.files || !req.files.abstractFile || !req.files.proposalFile) {
            throw new HttpError(HttpCode.BAD_REQUEST, "Invalid files");
        }
        await db.transaction(async (tx) => {
            const insertedFileIds: { [key: string]: number } = {};
            if (
                !Array.isArray(req.files) &&
                req.files &&
                Object.entries(req.files).length
            ) {
                const insertedFiles = await tx
                    .insert(files)
                    .values(
                        Object.entries(req.files).map(([fieldName, files]) => {
                            const file = files[0];
                            return {
                                userEmail: req.user!.email,
                                filePath: file.path,
                                originalName: file.originalname,
                                mimetype: file.mimetype,
                                size: file.size,
                                fieldName,
                                module: modules[3],
                            };
                        })
                    )
                    .returning();
                insertedFiles.forEach((file) => {
                    insertedFileIds[file.fieldName!] = file.id;
                });
            }

            const abstractFileId = insertedFileIds["abstractFile"];
            const proposalFileId = insertedFileIds["proposalFile"];

            try {
                const [proposal] = await tx
                    .insert(phdProposals)
                    .values({
                        studentEmail: req.user!.email,
                        supervisorEmail,
                        title,
                        abstractFileId,
                        proposalFileId,
                    })
                    .returning();
                if (!proposal)
                    throw new HttpError(
                        HttpCode.INTERNAL_SERVER_ERROR,
                        "Failed to create proposal"
                    );
                await createTodos(
                    [
                        {
                            module: modules[3],
                            assignedTo: supervisorEmail,
                            createdBy: req.user!.email,
                            title: "New PhD Proposal Submission",
                            description: `A PhD proposal by ${student.name ?? "Student"} is pending review.`,
                            link: `/phd/proposal/supervisor/viewProposal?id=${proposal.id}`,
                            completionEvent: `proposal:supervisor-review:${proposal.id}`,
                        },
                    ],
                    tx
                );
            } catch (e) {
                if ((e as { code: string })?.code === "23505")
                    throw new HttpError(
                        HttpCode.BAD_REQUEST,
                        "An active proposal already exists"
                    );
                throw e;
            }
        });
        res.status(200).send();
    })
);

export default router;
