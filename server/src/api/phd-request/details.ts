import { asyncHandler } from "@/middleware/routeHandler.ts";
import express from "express";
import db from "@/config/db/index.ts";
import { HttpError, HttpCode } from "@/config/errors.ts";
import { eq } from "drizzle-orm";
import { phdRequests } from "@/config/db/schema/phdRequest.ts";

const router = express.Router();


router.get(
    "/:id",
    asyncHandler(async (req, res) => {
        const requestId = parseInt(req.params.id);
        if (isNaN(requestId)) {
            throw new HttpError(HttpCode.BAD_REQUEST, "Invalid request ID.");
        }

        const request = await db.query.phdRequests.findFirst({
            where: eq(phdRequests.id, requestId),
            with: {
                student: { columns: { name: true, email: true } },
                supervisor: { columns: { name: true, email: true } },
                documents: {
                    with: {
                        file: {
                            columns: { originalName: true, id: true },
                        },
                    },
                    // Hide private documents from the student
                    where: (cols, { eq }) =>
                        req.user?.email === "student_email_placeholder"
                            ? eq(cols.isPrivate, false)
                            : undefined,
                },
                reviews: {
                    with: {
                        reviewer: { columns: { name: true } },
                    },
                    orderBy: (cols, { desc }) => [desc(cols.createdAt)],
                },
                drcAssignments: {
                    columns: { drcMemberEmail: true, status: true },
                },
            },
        });

        if (!request) {
            throw new HttpError(HttpCode.NOT_FOUND, "Request not found.");
        }

        // Replace placeholder with actual student email if needed for privacy filter
        if (req.user?.email === request.studentEmail) {
            request.documents = request.documents.filter(
                (doc) => !doc.isPrivate
            );
        }

        res.status(200).json(request);
    })
);

export default router;
