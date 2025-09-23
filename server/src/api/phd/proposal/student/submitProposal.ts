import db from "@/config/db/index.ts";
import {
    phdProposals,
    phdProposalSemesters,
    phdProposalCoSupervisors,
} from "@/config/db/schema/phd.ts";
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
import { sendEmail } from "@/lib/common/email.ts";
import { eq } from "drizzle-orm";

const router = express.Router();

router.post(
    "/",
    checkAccess(),
    asyncHandler((req, res, next) =>
        pdfUpload.fields(phdSchemas.phdProposalMulterFileFields)(
            req,
            res,
            (err) => {
                if (err instanceof multer.MulterError)
                    throw new HttpError(HttpCode.BAD_REQUEST, err.message);
                next(err);
            }
        )
    ),
    asyncHandler(async (req, res) => {
        const {
            title,
            hasOutsideCoSupervisor,
            declaration,
            proposalCycleId,
            internalCoSupervisors,
            externalCoSupervisors,
        } = phdSchemas.phdProposalSubmissionSchema.parse(req.body);
        const student = await db.query.phd.findFirst({
            where: (cols, { eq }) => eq(cols.email, req.user!.email),
        });
        assert(student, "PhD student record not found");
        const supervisorEmail = student.supervisorEmail;
        if (!supervisorEmail || !supervisorEmail.trim().length)
            throw new HttpError(
                HttpCode.BAD_REQUEST,
                "Supervisor not assigned"
            );
        const activeDeadline = await db.query.phdProposalSemesters.findFirst({
            where: eq(phdProposalSemesters.id, proposalCycleId),
        });
        if (!activeDeadline) {
            throw new HttpError(
                HttpCode.BAD_REQUEST,
                "The selected submission cycle was not found."
            );
        }
        if (new Date(activeDeadline.studentSubmissionDate) < new Date()) {
            throw new HttpError(
                HttpCode.FORBIDDEN,
                "The submission deadline for this cycle has passed."
            );
        }
        const proposalSemesterId = activeDeadline.id;
        if (Array.isArray(req.files))
            throw new HttpError(HttpCode.BAD_REQUEST, "Invalid files");
        const uploadedFiles = req.files as Record<
            (typeof phdSchemas.phdProposalFileFieldNames)[number],
            Express.Multer.File[]
        >;
        if (
            !uploadedFiles?.appendixFile ||
            !uploadedFiles?.summaryFile ||
            !uploadedFiles?.outlineFile
        ) {
            throw new HttpError(
                HttpCode.BAD_REQUEST,
                "Missing required proposal documents."
            );
        }
        if (
            student.phdType === "part-time" &&
            !uploadedFiles?.placeOfResearchFile
        ) {
            throw new HttpError(
                HttpCode.BAD_REQUEST,
                "Part-time students must upload the 'Place of Research' document."
            );
        }
        if (
            hasOutsideCoSupervisor &&
            (!uploadedFiles?.outsideCoSupervisorFormatFile ||
                !uploadedFiles?.outsideSupervisorBiodataFile)
        ) {
            throw new HttpError(
                HttpCode.BAD_REQUEST,
                "Documents for outside co-supervisor are required."
            );
        }
        let submittedProposalId: number = -1;
        await db.transaction(async (tx) => {
            const insertedFileIds: Partial<
                Record<
                    (typeof phdSchemas.phdProposalFileFieldNames)[number],
                    number
                >
            > = {};
            if (req.files && Object.entries(req.files).length) {
                const fileInserts = Object.entries(req.files).map(
                    ([fieldName, files]) => {
                        const file = (files as Express.Multer.File[])[0];
                        return {
                            userEmail: req.user!.email,
                            filePath: file.path,
                            originalName: file.originalname,
                            mimetype: file.mimetype,
                            size: file.size,
                            fieldName,
                            module: modules[3],
                        };
                    }
                );
                const inserted = await tx
                    .insert(files)
                    .values(fileInserts)
                    .returning();
                inserted.forEach((file) => {
                    insertedFileIds[
                        file.fieldName as (typeof phdSchemas.phdProposalFileFieldNames)[number]
                    ] = file.id;
                });
            }
            const [proposal] = await tx
                .insert(phdProposals)
                .values({
                    studentEmail: req.user!.email,
                    supervisorEmail,
                    title,
                    proposalSemesterId,
                    hasOutsideCoSupervisor,
                    declaration,
                    appendixFileId: insertedFileIds.appendixFile!,
                    summaryFileId: insertedFileIds.summaryFile!,
                    outlineFileId: insertedFileIds.outlineFile!,
                    placeOfResearchFileId: insertedFileIds.placeOfResearchFile,
                    outsideCoSupervisorFormatFileId:
                        insertedFileIds.outsideCoSupervisorFormatFile,
                    outsideSupervisorBiodataFileId:
                        insertedFileIds.outsideSupervisorBiodataFile,
                })
                .returning();
            if (!proposal)
                throw new HttpError(
                    HttpCode.INTERNAL_SERVER_ERROR,
                    "Failed to create proposal"
                );
            submittedProposalId = proposal.id;
            const coSupervisorsToInsert = [];
            if (internalCoSupervisors) {
                coSupervisorsToInsert.push(
                    ...internalCoSupervisors.map((email) => ({
                        proposalId: submittedProposalId,
                        coSupervisorEmail: email,
                    }))
                );
            }
            if (externalCoSupervisors) {
                coSupervisorsToInsert.push(
                    ...externalCoSupervisors.map((ext) => ({
                        proposalId: submittedProposalId,
                        coSupervisorEmail: ext.email,
                        coSupervisorName: ext.name,
                    }))
                );
            }
            if (coSupervisorsToInsert.length > 0) {
                await tx
                    .insert(phdProposalCoSupervisors)
                    .values(coSupervisorsToInsert);
            }
        });
        await createTodos([
            {
                assignedTo: supervisorEmail,
                createdBy: req.user!.email,
                title: `PhD Proposal Review Required for ${student.name}`,
                description: `Please review the new PhD proposal submitted by your student, ${student.name}.`,
                module: modules[3],
                completionEvent: `proposal:supervisor-review:${submittedProposalId}`,
                link: `/phd/supervisor/proposal/${submittedProposalId}`,
                deadline: activeDeadline.facultyReviewDate,
            },
        ]);
        await sendEmail({
            to: supervisorEmail,
            subject: `PhD Proposal Submitted for Review by ${student.name}`,
            text: `Dear Supervisor,\n\nYour student, ${student.name}, has submitted their PhD research proposal titled "${title}" for your review.\n\nPlease log in to the portal to view the details and take action.\n\nThank you.`,
        });
        res.status(200).send({
            success: true,
            message: "Proposal submitted successfully.",
        });
    })
);

export default router;
