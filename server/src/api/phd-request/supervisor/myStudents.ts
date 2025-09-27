import { asyncHandler } from "@/middleware/routeHandler.ts";
import { checkAccess } from "@/middleware/auth.ts";
import express from "express";
import db from "@/config/db/index.ts";
import { eq, desc } from "drizzle-orm";
import { phd } from "@/config/db/schema/admin.ts";
import { phdRequests } from "@/config/db/schema/phdRequest.ts";
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
            const latestProposal = student.proposals[0];
            const latestRequest = student.requests[0];

            // Determine current status based on a hierarchy: Request -> Proposal -> QE
            if (latestRequest) {
                currentStatus = `Request: ${latestRequest.requestType.replace(/_/g, " ")} - ${latestRequest.status.replace(/_/g, " ")}`;
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

            if (latestProposal?.status === "completed") {
                if (
                    !latestRequest ||
                    completedRequestStatuses.includes(latestRequest.status)
                ) {
                    canInitiateRequest = true;
                }
            }

            return {
                email: student.email,
                name: student.name,
                idNumber: student.idNumber,
                currentStatus,
                canInitiateRequest,
            };
        });

        res.status(200).json(studentStatuses);
    })
);

export default router;
