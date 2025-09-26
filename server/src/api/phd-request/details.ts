// server/src/api/phd-request/details.ts
import { asyncHandler } from "@/middleware/routeHandler.ts";
import { checkAccess } from "@/middleware/auth.ts";
import express from "express";
import db from "@/config/db/index.ts";
import { phdRequests } from "@/config/db/schema/phdRequest.ts";
import { eq } from "drizzle-orm";
import { HttpError, HttpCode } from "@/config/errors.ts";
import { getUsersWithPermission } from "@/lib/common/index.ts";

const router = express.Router();

router.get(
    "/:id",
    checkAccess(), 
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
                        file: { columns: { id: true, originalName: true } },
                    },
                },
                reviews: {
                    with: { reviewer: { columns: { name: true } } },
                    orderBy: (r, { asc }) => [asc(r.createdAt)],
                },
                drcAssignments: true,
            },
        });

        if (!request) {
            throw new HttpError(HttpCode.NOT_FOUND, "Request not found.");
        }

        // Authorization Check
        const userEmail = req.user!.email;
        const isStudent = userEmail === request.student.email;
        const isSupervisor = userEmail === request.supervisor.email;
        const isAssignedDrc = request.drcAssignments.some(
            (a) => a.drcMemberEmail === userEmail
        );
        const isDrcConvener = (
            await getUsersWithPermission("phd-request:drc-convener:view")
        ).some((u) => u.email === userEmail);
        const isHod = (
            await getUsersWithPermission("phd-request:hod:view")
        ).some((u) => u.email === userEmail);

        if (
            !isStudent &&
            !isSupervisor &&
            !isAssignedDrc &&
            !isDrcConvener &&
            !isHod
        ) {
            throw new HttpError(
                HttpCode.FORBIDDEN,
                "You do not have permission to view this request."
            );
        }

        res.status(200).json(request);
    })
);

export default router;
