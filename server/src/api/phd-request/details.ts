import { asyncHandler } from "@/middleware/routeHandler.ts";
import express from "express";
import db from "@/config/db/index.ts";
import { HttpError, HttpCode } from "@/config/errors.ts";
import { eq } from "drizzle-orm";
import { phdRequests } from "@/config/db/schema/phdRequest.ts";
import { getAccess } from "@/lib/auth/index.ts";

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
                        file: { columns: { originalName: true, id: true } },
                    },
                    where: (cols, { eq }) =>
                        req.user?.email === "student_email_placeholder"
                            ? eq(cols.isPrivate, false)
                            : undefined,
                },
                reviews: {
                    with: {
                        reviewer: {
                            columns: { name: true, email: true, roles: true },
                        },
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

        // Augment reviews with a definitive display name from the backend
        const augmentedReviews = await Promise.all(
            request.reviews.map(async (review) => {
                let reviewerDisplayName =
                    review.reviewer.name || review.reviewer.email;
                const reviewer = review.reviewer;

                if (reviewer.email === request.supervisorEmail) {
                    reviewerDisplayName = "Supervisor";
                } else if (
                    request.drcAssignments.some(
                        (a) => a.drcMemberEmail === reviewer.email
                    )
                ) {
                    const index = request.drcAssignments.findIndex(
                        (a) => a.drcMemberEmail === reviewer.email
                    );
                    reviewerDisplayName =
                        `DRC Member ${index >= 0 ? index + 1 : ""}`.trim();
                } else {
                    const permissions = await getAccess(reviewer.roles);
                    if (
                        permissions.allowed.includes("phd-request:hod:review")
                    ) {
                        reviewerDisplayName = `HOD (${reviewer.name})`;
                    } else if (
                        permissions.allowed.includes(
                            "phd-request:drc-convener:review"
                        )
                    ) {
                        reviewerDisplayName = `DRC Convener (${reviewer.name})`;
                    }
                }
                return { ...review, reviewerDisplayName };
            })
        );

        const finalRequest = { ...request, reviews: augmentedReviews };

        if (req.user?.email === finalRequest.studentEmail) {
            finalRequest.documents = finalRequest.documents.filter(
                (doc) => !doc.isPrivate
            );
        }

        res.status(200).json(finalRequest);
    })
);

export default router;
