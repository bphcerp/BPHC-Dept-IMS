import express from "express";
import db from "@/config/db/index.ts";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import { qpSchemas } from "lib";
import { qpReviewRequests } from "@/config/db/schema/qp.ts";

const router = express.Router();

router.post(
    "/",
    asyncHandler(async (req, res) => {
        const parsed = qpSchemas.createQpReviewSchema.parse(req.body);
        const {
            dcaMemberEmail,
            courseNo,
            courseName,
            fic,
            ficDeadline,
            reviewDeadline,
        } = parsed;

        console.log({
            dcaMemberEmail,
            courseCode: courseNo,
            courseName,
            ficEmail: fic,
            ficDeadline,
            reviewDeadline,
        });

        const newRequest = await db
            .insert(qpReviewRequests)
            .values({
                dcaMemberEmail,
                courseCode: courseNo,
                courseName,
                ficEmail: fic,
                ficDeadline: new Date(ficDeadline),
                reviewDeadline: new Date(reviewDeadline),
                documentsUploaded: false,
            })
            .returning();

        res.status(201).json({
            success: true,
            message: "QP review request created successfully",
            data: newRequest[0],
        });
    })
);

export default router;
