import { asyncHandler } from "@/middleware/routeHandler.ts";
import express from "express";
import db from "@/config/db/index.ts";
import { HttpError, HttpCode } from "@/config/errors.ts";
import { eq, desc } from "drizzle-orm";
import { phdRequests } from "@/config/db/schema/phdRequest.ts";
import { phd } from "@/config/db/schema/admin.ts";
import { authUtils } from "lib";

const router = express.Router();

router.get(
    "/:studentEmail",
    asyncHandler(async (req, res) => {
        const studentEmail = req.params.studentEmail;
        const requestingUser = req.user;

        if (!requestingUser) {
            throw new HttpError(
                HttpCode.UNAUTHORIZED,
                "Authentication required."
            );
        }

        // Authorization Check
        const studentData = await db.query.phd.findFirst({
            where: eq(phd.email, studentEmail),
            columns: { supervisorEmail: true },
        });

        if (!studentData) {
            throw new HttpError(HttpCode.NOT_FOUND, "Student not found.");
        }

        const isSupervisor =
            requestingUser.email === studentData.supervisorEmail;
        const isDrcConvener = authUtils.checkAccess(
            "phd-request:drc-convener:view",
            requestingUser.permissions
        );
        const isHod = authUtils.checkAccess(
            "phd-request:hod:view",
            requestingUser.permissions
        );

        if (!isSupervisor && !isDrcConvener && !isHod) {
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
                        file: {
                            columns: { originalName: true, id: true },
                        },
                    },
                },
                reviews: {
                    with: {
                        reviewer: { columns: { name: true } },
                    },
                    orderBy: (cols, { desc }) => [desc(cols.createdAt)],
                },
            },
            orderBy: [desc(phdRequests.createdAt)],
        });

        if (!requests) {
            throw new HttpError(
                HttpCode.NOT_FOUND,
                "No requests found for this student."
            );
        }

        res.status(200).json(requests);
    })
);

export default router;
