// server/src/api/phd-request/details.ts
import { asyncHandler } from "@/middleware/routeHandler.ts";
import express from "express";
import db from "@/config/db/index.ts";
import { HttpError, HttpCode } from "@/config/errors.ts";
import { eq } from "drizzle-orm";
import { phdRequests } from "@/config/db/schema/phdRequest.ts";
import { authUtils } from "lib";

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
                },
                reviews: {
                    with: {
                        reviewer: { columns: { name: true, email: true } },
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

        const isPrivilegedViewer =
            req.user &&
            (authUtils.checkAccess(
                "phd-request:hod:view",
                req.user.permissions
            ) ||
                authUtils.checkAccess(
                    "phd-request:drc-convener:view",
                    req.user.permissions
                ));

        const augmentedReviews = request.reviews.map((review: any) => {
            let roleTitle = "";
            const reviewer = review.reviewer;
            const actionText = review.approved
                ? "Approved by "
                : "Reverted by ";

            switch (review.reviewerRole) {
                case "HOD":
                    roleTitle = "HOD";
                    break;
                case "DRC_CONVENER":
                    roleTitle = "DRC Convener";
                    break;
                case "DRC_MEMBER":
                    const index = request.drcAssignments.findIndex(
                        (a) => a.drcMemberEmail === reviewer.email
                    );
                    roleTitle =
                        `DRC Member ${index >= 0 ? index + 1 : ""}`.trim();
                    break;
                case "SUPERVISOR":
                    if (
                        review.status_at_review === "supervisor_submitted" ||
                        review.comments ===
                            "Request resubmitted with corrections."
                    ) {
                        return {
                            ...review,
                            reviewerDisplayName: "Submitted by Supervisor",
                        };
                    }
                    roleTitle = "Supervisor";
                    break;
                case "STUDENT":
                    roleTitle = "Student";
                    break;
                default:
                    roleTitle = review.reviewerRole;
                    break;
            }

            const nameSuffix = isPrivilegedViewer
                ? ` (${reviewer.name || reviewer.email})`
                : "";
            const reviewerDisplayName = `${actionText}${roleTitle}${nameSuffix}`;

            return { ...review, reviewerDisplayName };
        });

        const finalRequest = { ...request, reviews: augmentedReviews };

        // Filter out private data for students
        if (req.user?.email === finalRequest.studentEmail) {
            finalRequest.documents = finalRequest.documents.filter(
                (doc) => !doc.isPrivate
            );
            finalRequest.reviews.forEach((review) => {
                // @ts-ignore
                delete review.supervisorComments;
            });
        }

        res.status(200).json(finalRequest);
    })
);

export default router;
