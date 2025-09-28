import { asyncHandler } from "@/middleware/routeHandler.ts";
import { checkAccess } from "@/middleware/auth.ts";
import express from "express";
import db from "@/config/db/index.ts";
import { eq, desc } from "drizzle-orm";
import { phd } from "@/config/db/schema/admin.ts";
import {
    phdRequests,
    phdRequestReviews,
} from "@/config/db/schema/phdRequest.ts";
import { phdProposals } from "@/config/db/schema/phd.ts";
import { phdRequestSchemas } from "lib";

const router = express.Router();

router.get(
    "/",
    checkAccess("phd-request:supervisor:view"),
    asyncHandler(async (req, res) => {
        const supervisorEmail = req.user!.email;

        const students = await db.query.phd.findMany({
            where: eq(phd.supervisorEmail, supervisorEmail),
            with: {
                proposals: {
                    orderBy: [desc(phdProposals.createdAt)],
                    limit: 1,
                },
                requests: {
                    orderBy: [desc(phdRequests.createdAt)],
                    limit: 1,
                    with: {
                        reviews: {
                            orderBy: [desc(phdRequestReviews.createdAt)],
                            limit: 1,
                        },
                    },
                },
                qeApplications: {
                    orderBy: (cols, { desc }) => [desc(cols.createdAt)],
                    limit: 2,
                },
            },
        });

        const studentStatuses = students.map((student) => {
            let currentStatus = "No Activity";
            let canInitiateRequest = false;
            let canResubmitRequest = false;
            let reversionComments: string | null = null;
            let requestId: number | null = null;

            const latestProposal = student.proposals[0];
            const latestRequest = student.requests[0];

            const revertableStatuses: (typeof phdRequestSchemas.phdRequestStatuses)[number][] =
                [
                    "reverted_by_drc_convener",
                    "reverted_by_drc_member",
                    "reverted_by_hod",
                ];

            if (latestRequest) {
                requestId = latestRequest.id;
                currentStatus = `Request: ${latestRequest.requestType.replace(/_/g, " ")} - ${latestRequest.status.replace(/_/g, " ")}`;

                if (revertableStatuses.includes(latestRequest.status)) {
                    canResubmitRequest = true;
                    reversionComments =
                        latestRequest.reviews[0]?.comments ||
                        "No comments provided.";
                }
            } else if (latestProposal) {
                currentStatus = `Proposal: ${latestProposal.status.replace(/_/g, " ")}`;
            } else if (student.qeApplications.length > 0) {
                const lastAttempt = student.qeApplications[0];
                currentStatus = `QE Attempt ${lastAttempt.attemptNumber}: ${lastAttempt.status}`;
                if (lastAttempt.result) {
                    currentStatus += ` (${lastAttempt.result})`;
                }
            } else {
                currentStatus = "Awaiting QE Application";
            }

            const completedRequestStatuses: (typeof phdRequestSchemas.phdRequestStatuses)[number][] =
                ["completed"];

            // Default eligibility for new requests
            if (latestProposal?.status === "completed") {
                if (
                    !latestRequest ||
                    completedRequestStatuses.includes(latestRequest.status)
                ) {
                    canInitiateRequest = true;
                }
            }

            // Override for final thesis submission: can only be initiated after thesis_submission is complete.
            if (
                latestRequest?.requestType === "thesis_submission" &&
                latestRequest.status === "completed"
            ) {
                canInitiateRequest = true;
            } else if (
                latestRequest &&
                latestRequest.requestType !== "thesis_submission" &&
                latestRequest.status === "completed"
            ) {
                // can still initiate other requests
                canInitiateRequest = true;
            } else if (
                latestRequest &&
                !completedRequestStatuses.includes(latestRequest.status)
            ) {
                // if there's any active request, cannot initiate a new one
                canInitiateRequest = false;
            }

            return {
                email: student.email,
                name: student.name,
                idNumber: student.idNumber,
                currentStatus,
                canInitiateRequest,
                canResubmitRequest,
                reversionComments,
                requestId,
            };
        });
        res.status(200).json(studentStatuses);
    })
);

export default router;
