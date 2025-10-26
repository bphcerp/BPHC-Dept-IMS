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

type PhdRequestType = (typeof phdRequestSchemas.phdRequestTypes)[number];

const postProposalRequestSequence: (PhdRequestType | PhdRequestType[])[] = [
    "pre_submission",
    "draft_notice",
    ["change_of_title", "pre_thesis_submission"],
    "final_thesis_submission",
];
const anytimeRequests: PhdRequestType[] = [
    "jrf_recruitment",
    "jrf_to_phd_conversion",
    "project_fellow_conversion",
    "manage_co_supervisor",
    "stipend_payment",
    "international_travel_grant",
    "rp_grades",
    "change_of_workplace",
    "semester_drop",
    "thesis_submission_extension",
    "endorsements",
    "phd_aspire_application",
    "not_registered_student",
];

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
                    with: {
                        reviews: {
                            orderBy: [desc(phdRequestReviews.createdAt)],
                            limit: 1,
                        },
                    },
                },
                qeApplications: {
                    orderBy: (cols, { desc }) => [desc(cols.createdAt)],
                    limit: 1,
                },
            },
        });

        const studentStatuses = students.map((student) => {
            let currentStatus = student.currentStatus; // Start with the baseline status
            let canResubmitRequest = false;
            let reversionComments: string | null = null;
            let requestId: number | null = null;

            const allRequests = student.requests;
            const latestProposal = student.proposals[0];
            const latestQeApplication = student.qeApplications[0];

            const revertableStatuses: (typeof phdRequestSchemas.phdRequestStatuses)[number][] =
                [
                    "reverted_by_drc_convener",
                    "reverted_by_drc_member",
                    "reverted_by_hod",
                ];

            // PRIORITY 1: Check for any active request (highest priority)
            const latestActiveRequest = allRequests.find(
                (req) => !["completed", "deleted"].includes(req.status)
            );

            if (latestActiveRequest) {
                currentStatus = `Request: ${latestActiveRequest.requestType.replace(/_/g, " ")} - ${latestActiveRequest.status.replace(/_/g, " ")}`;
                requestId = latestActiveRequest.id;
                if (revertableStatuses.includes(latestActiveRequest.status)) {
                    canResubmitRequest = true;
                    reversionComments =
                        latestActiveRequest.reviews[0]?.comments ||
                        "No comments provided.";
                }
            }
            // PRIORITY 2: Check for an active proposal
            else if (
                latestProposal &&
                latestProposal.status !== "completed" &&
                latestProposal.status !== "deleted"
            ) {
                currentStatus = `Proposal: ${latestProposal.status.replace(/_/g, " ")}`;
            }
            // PRIORITY 3: Check for the latest QE application status
            else if (latestQeApplication) {
                const status = `QE Attempt: ${latestQeApplication.status}`;
                currentStatus = latestQeApplication.result
                    ? `${status} (${latestQeApplication.result})`
                    : status;
            }
            // Fallback to the database status if no active workflows are found
            else {
                currentStatus = student.currentStatus;
            }

            const availableRequestTypes: PhdRequestType[] = [
                ...anytimeRequests,
            ];
            if (latestProposal?.status === "completed") {
                const completedTypes = new Set(
                    allRequests
                        .filter((r) => r.status === "completed")
                        .map((r) => r.requestType)
                );
                for (const step of postProposalRequestSequence) {
                    const isStepArray = Array.isArray(step);
                    const stepRequests = isStepArray ? step : [step];
                    const isStepCompleted = stepRequests.some((type) =>
                        completedTypes.has(type)
                    );
                    if (!isStepCompleted) {
                        availableRequestTypes.push(...stepRequests);
                        break;
                    }
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
