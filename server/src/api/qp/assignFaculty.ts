import express from "express";
import db from "@/config/db/index.ts";
import { asyncHandler } from "@/middleware/routeHandler.ts";
// import { checkAccess } from "@/middleware/auth.ts";
import { qpSchemas } from "lib";
import { qpReviewRequests } from "@/config/db/schema/qp.ts";
import { users } from "@/config/db/schema/admin.ts";
import { eq } from "drizzle-orm";

const router = express.Router();

router.post(
    "/",
    // checkAccess(),
    asyncHandler(async (req, res) => {
        const parsed = qpSchemas.assignQpReviewerSchema.parse(req.body);
        const { id, faculty1Email, faculty2Email } = parsed;

        const reviewRequest = await db.query.qpReviewRequests.findFirst({
            where: eq(qpReviewRequests.id, Number(id)),
            columns: { id: true },
        });

        if (!reviewRequest) {
            res.status(404).json({
                success: false,
                message: "QP review request not found",
            });
            return; 
        }

        const faculty1Exists = await db.query.users.findFirst({
            where: eq(users.email, faculty1Email),
            columns: { email: true },
        });

        const faculty2Exists = await db.query.users.findFirst({
            where: eq(users.email, faculty2Email),
            columns: { email: true },
        });

        console.log(faculty1Exists, faculty2Exists)


        if (!faculty1Exists || !faculty2Exists) {
            res.status(400).json({
                success: false,
                message: "One or both faculty members are not registered users",
            });
            return; 
        }

        const updatedRequest = await db
            .update(qpReviewRequests)
            .set({
                faculty1Email,
                faculty2Email,
            })
            .where(eq(qpReviewRequests.id, Number(id)))
            .returning();

        res.status(200).json({
            success: true,
            message: "Faculty assigned successfully",
            data: updatedRequest[0],
        });
        return; 
    })
);

export default router;
