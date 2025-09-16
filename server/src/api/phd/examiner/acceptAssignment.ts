import express from "express";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import { checkAccess } from "@/middleware/auth.ts";
import db from "@/config/db/index.ts";
import { HttpCode, HttpError } from "@/config/errors.ts";
import { phdExaminerAssignments } from "@/config/db/schema/phd.ts";
import { and, eq, isNull } from "drizzle-orm";

const router = express.Router();

export default router.post(
    "/:id",
    checkAccess(),
    asyncHandler(async (req, res) => {
        const id = Number.parseInt(req.params.id);
        if (Number.isNaN(id) || id < 0) {
            throw new HttpError(HttpCode.BAD_REQUEST, "Invalid ID");
        }

        const updated = await db
            .update(phdExaminerAssignments)
            .set({ hasAccepted: true })
            .where(
                and(
                    eq(phdExaminerAssignments.id, id),
                    eq(phdExaminerAssignments.examinerEmail, req.user!.email),
                    isNull(phdExaminerAssignments.hasAccepted)
                )
            )
            .returning();

        if (!updated.length) {
            throw new HttpError(
                HttpCode.NOT_FOUND,
                "Assignment not found for this examiner"
            );
        }

        res.status(200).send();
    })
);
