import express from "express";
import db from "@/config/db/index.ts";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import { checkAccess } from "@/middleware/auth.ts";
import { qpSchemas } from "lib";
import { qpReviewRequests } from "@/config/db/schema/qp.ts";
import { users } from "@/config/db/schema/admin.ts";
import { eq } from "drizzle-orm";

const router = express.Router();

router.put(
    "/editQpRequest/:id",
    checkAccess(),
    asyncHandler(async (req, res) => {
        const { id } = req.params;
        const parsed = qpSchemas.editQpReviewSchema.parse(req.body);

        const reviewRequest = await db.query.qpReviewRequests.findFirst({
            where: eq(qpReviewRequests.id, Number(id)),
        });

        if (!reviewRequest) {
            res.status(404).json({
                success: false,
                message: "QP review request not found",
            });
            return;
        }

        if (parsed.dcaMemberEmail) {
            const dcaExists = await db.query.users.findFirst({
                where: eq(users.email, parsed.dcaMemberEmail),
            });
            if (!dcaExists) {
                res.status(400).json({
                    success: false,
                    message: "DCA member not found",
                });
                return;
            }
        }

        if (parsed.ficEmail) {
            const ficExists = await db.query.users.findFirst({
                where: eq(users.email, parsed.ficEmail),
            });
            if (!ficExists) {
                res.status(400).json({
                    success: false,
                    message: "FIC not found",
                });
                return;
            }
        }

        if (parsed.faculty1Email) {
            const faculty1Exists = await db.query.users.findFirst({
                where: eq(users.email, parsed.faculty1Email),
            });
            if (!faculty1Exists) {
                res.status(400).json({
                    success: false,
                    message: "Faculty 1 not found",
                });
                return;
            }
        }

        if (parsed.faculty2Email) {
            const faculty2Exists = await db.query.users.findFirst({
                where: eq(users.email, parsed.faculty2Email),
            });
            if (!faculty2Exists) {
                res.status(400).json({
                    success: false,
                    message: "Faculty 2 not found",
                });
                return;
            }
        }

        const updateData = Object.fromEntries(
            Object.entries(parsed).filter(([_, v]) => v !== undefined)
        );

        const updatedRequest = await db
            .update(qpReviewRequests)
            .set(updateData)
            .where(eq(qpReviewRequests.id, Number(id)))
            .returning();

        res.status(200).json({
            success: true,
            message: "QP review request updated successfully",
            data: updatedRequest[0],
        });
    })
);

export default router;
