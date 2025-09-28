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

const anytimeRequests = phdRequestSchemas.phdRequestTypes.filter(
    (type) =>
        ![
            "pre_submission",
            "draft_notice",
            "change_of_title",
            "thesis_submission",
            "final_thesis_submission",
        ].includes(type)
);

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
                // Fetch all requests to determine the correct state
                requests: {
                    orderBy: [desc(phdRequests.createdAt)],
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
            let canResubmitRequest = false;
            let reversionComments: string | null = null;
            let requestId: number | null = null;
            let availableRequestTypes: string[] = [];

            const latestProposal = student.proposals[0];
            const allRequests = student.requests;
            const latestRequest = allRequests[0];

            const revertableStatuses: (typeof phdRequestSchemas.phdRequestStatuses)[number][] =
                [
                    "reverted_by_drc_convener",
                    "reverted_by_drc_member",
                    "reverted_by_hod",
                ];

            const activeRequest = allRequests.find(
                (req) =>
                    !revertableStatuses.includes(req.status) &&
                    req.status !== "completed"
            );

            if (activeRequest) {
                currentStatus = `Request: ${activeRequest.requestType.replace(/_/g, " ")} - ${activeRequest.status.replace(/_/g, " ")}`;
                requestId = activeRequest.id;
            } else if (latestRequest) {
                // No active, check latest for reverted or completed status
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

            // Determine available request types only if no request is active
            if (!activeRequest && latestProposal?.status === "completed") {
                const completedTypes = new Set(
                    allRequests
                        .filter((r) => r.status === "completed")
                        .map((r) => r.requestType)
                );

                availableRequestTypes.push(...anytimeRequests);

                if (!completedTypes.has("pre_submission")) {
                    availableRequestTypes.push("pre_submission");
                } else if (!completedTypes.has("draft_notice")) {
                    availableRequestTypes.push("draft_notice");
                } else if (!completedTypes.has("thesis_submission")) {
                    availableRequestTypes.push(
                        "thesis_submission",
                        "change_of_title"
                    );
                } else if (!completedTypes.has("final_thesis_submission")) {
                    availableRequestTypes.push("final_thesis_submission");
                }
            }

            return {
                email: student.email,
                name: student.name,
                idNumber: student.idNumber,
                currentStatus,
                canResubmitRequest,
                reversionComments,
                requestId,
                availableRequestTypes,
            };
        });
        res.status(200).json(studentStatuses);
    })
);

export default router;
