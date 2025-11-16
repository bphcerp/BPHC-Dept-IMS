import { asyncHandler } from "@/middleware/routeHandler.ts";
import express from "express";
import db from "@/config/db/index.ts";
import { HttpError, HttpCode } from "@/config/errors.ts";
import { eq, desc } from "drizzle-orm";
import { phdRequests } from "@/config/db/schema/phdRequest.ts";
import { phd } from "@/config/db/schema/admin.ts";
import { authUtils, phdRequestSchemas } from "lib";

const router = express.Router();

router.get(
    "/:studentEmail",
    asyncHandler(async (req, res) => {
        const studentEmailParam = req.params.studentEmail;
        const requestingUser = req.user;

        if (!requestingUser) {
            throw new HttpError(
                HttpCode.UNAUTHORIZED,
                "Authentication required."
            );
        }

        const studentEmail =
            studentEmailParam === "me"
                ? requestingUser.email
                : studentEmailParam;

        const studentData = await db.query.phd.findFirst({
            where: eq(phd.email, studentEmail),
            columns: { supervisorEmail: true },
        });

        if (!studentData) {
            throw new HttpError(HttpCode.NOT_FOUND, "Student not found.");
        }

        const isSelf = requestingUser.email === studentEmail;
        const isSupervisor =
            requestingUser.email === studentData.supervisorEmail;
        const isPrivilegedViewer =
            authUtils.checkAccess(
                "phd-request:drc-convener:view",
                requestingUser.permissions
            ) ||
            authUtils.checkAccess(
                "phd-request:hod:view",
                requestingUser.permissions
            ) ||
            authUtils.checkAccess(
                "phd-request:staff:view",
                requestingUser.permissions
            );

        if (!isSelf && !isSupervisor && !isPrivilegedViewer) {
            throw new HttpError(
                HttpCode.FORBIDDEN,
                "You do not have permission to view this student's history."
            );
        }

        const requests = await db.query.phdRequests.findMany({
            where: eq(phdRequests.studentEmail, studentEmail),
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
                drcAssignments: { columns: { drcMemberEmail: true } },
            },
            orderBy: [desc(phdRequests.createdAt)],
        });

        if (!requests) {
            throw new HttpError(
                HttpCode.NOT_FOUND,
                "No requests found for this student."
            );
        }

        const lockedForSupervisorStatuses: (typeof phdRequestSchemas.phdRequestStatuses)[number][] =
            [
                "supervisor_submitted",
                "drc_convener_review",
                "drc_member_review",
                "hod_review",
                "supervisor_review_final_thesis",
            ];

        const finalRequests = requests.map((request) => {
            let reviewsToProcess = request.reviews;
            if (isSupervisor && !isPrivilegedViewer) {
                reviewsToProcess = request.reviews.filter(
                    (review) => review.reviewerRole !== "DRC_MEMBER"
                );
            }

            const augmentedReviews = reviewsToProcess.map((review: any) => {
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
                            review.status_at_review ===
                                "supervisor_submitted" ||
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

            const canRequestEdit =
                isSupervisor &&
                lockedForSupervisorStatuses.includes(request.status);

            const finalRequest = {
                ...request,
                reviews: augmentedReviews,
                canRequestEdit,
            };

            if (isSelf) {
                finalRequest.documents = finalRequest.documents.filter(
                    (doc) => !doc.isPrivate
                );
                finalRequest.reviews.forEach((review) => {
                    delete review.supervisorComments;
                });
            }
            return finalRequest;
        });

        res.status(200).json(finalRequests);
    })
);

export default router;
