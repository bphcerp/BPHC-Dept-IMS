// server/src/api/phd/supervisor/my-students-status.ts
import { asyncHandler } from "@/middleware/routeHandler.ts";
import { checkAccess } from "@/middleware/auth.ts";
import express from "express";
import db from "@/config/db/index.ts";
import { phd } from "@/config/db/schema/admin.ts";
import { phdRequests } from "@/config/db/schema/phdRequest.ts";
import { phdProposals } from "@/config/db/schema/phd.ts";
// FIX: Added inArray and notInArray to the import statement
import { eq, and, inArray, notInArray } from "drizzle-orm";
import { phdSchemas } from "lib";

const router = express.Router();

const formatTitle = (text: string) =>
    text.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());

router.get(
    "/",
    checkAccess(),
    asyncHandler(async (req, res) => {
        const supervisorEmail = req.user!.email;

        const students = await db.query.phd.findMany({
            where: eq(phd.supervisorEmail, supervisorEmail),
            columns: { email: true, name: true, idNumber: true },
        });

        const studentEmails = students.map((s) => s.email);
        if (studentEmails.length === 0) {
            res.status(200).json([]);
        }

        const activeRequests = await db.query.phdRequests.findMany({
            where: and(
                inArray(phdRequests.studentEmail, studentEmails),
                notInArray(phdRequests.status, [
                    "completed",
                    "reverted_by_drc_convener",
                    "reverted_by_drc_member",
                    "reverted_by_hod",
                ])
            ),
        });

        const activeProposals = await db.query.phdProposals.findMany({
            where: and(
                inArray(phdProposals.studentEmail, studentEmails),
                notInArray(
                    phdProposals.status,
                    phdSchemas.inactivePhdProposalStatuses
                )
            ),
        });

        const statusMap = students.map((student) => {
            const activeRequest = activeRequests.find(
                (r) => r.studentEmail === student.email
            );
            if (activeRequest) {
                return {
                    ...student,
                    currentStatus: `Request - ${formatTitle(activeRequest.requestType)} (${formatTitle(activeRequest.status)})`,
                    canInitiateRequest: false,
                };
            }

            const activeProposal = activeProposals.find(
                (p) => p.studentEmail === student.email
            );
            if (activeProposal) {
                return {
                    ...student,
                    currentStatus: `Proposal - ${formatTitle(activeProposal.status)}`,
                    canInitiateRequest: false,
                };
            }

            return {
                ...student,
                currentStatus: "Post-Proposal Stage",
                canInitiateRequest: true,
            };
        });

        res.status(200).json(statusMap);
    })
);

export default router;
