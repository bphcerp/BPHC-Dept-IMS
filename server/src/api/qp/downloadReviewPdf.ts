import { asyncHandler } from "@/middleware/routeHandler.ts";
import express from "express";
import {
    generateSingleReviewPDF,
    generateReviewsZip,
} from "./functions/creteReviewPdf.ts";
import { checkAccess } from "@/middleware/auth.ts";

const router = express.Router();

router.post(
    "/",
    checkAccess(),
    asyncHandler(async (req, res) => {
        // Validate that request body is an array of review objects
        if (!Array.isArray(req.body)) {
            return res.status(400).json({
                success: false,
                message: "Request body must be an array of review objects",
            });
        }

        if (req.body.length === 0) {
            return res.status(400).json({
                success: false,
                message: "No review data provided",
            });
        }

        // Validate required fields in each review object
        const requiredFields = [
            "id",
            "courseName",
            "courseCode",
            "review",
            "icEmail",
            "reviewerEmail",
        ];
        const isValidData = req.body.every((review: any) =>
            requiredFields.every((field) => review.hasOwnProperty(field))
        );

        if (!isValidData) {
            return res.status(400).json({
                success: false,
                message:
                    "Invalid review data structure. Missing required fields.",
            });
        }

        const reviewRequests = req.body;
        const courseCount = reviewRequests.length;

        let fileBuffer: Buffer;
        let filename: string;
        let contentType: string;

        if (courseCount === 1) {
            // Single course - generate single PDF

            fileBuffer = await generateSingleReviewPDF(reviewRequests[0]);

            const courseCode = reviewRequests[0].courseCode;
            const courseName = reviewRequests[0].courseName.replace(
                /[^a-zA-Z0-9]/g,
                "_"
            );
            filename = `${courseCode}-${courseName}-Review.pdf`;
            contentType = "application/pdf";
        } else {
            // Multiple courses - generate ZIP with individual PDFs

            fileBuffer = await generateReviewsZip(reviewRequests);

            const timestamp = new Date().toISOString().split("T")[0];
            filename = `reviews-${courseCount}-courses-${timestamp}.zip`;
            contentType = "application/zip";
        }

        // Set response headers for file download
        res.setHeader("Content-Type", contentType);
        res.setHeader(
            "Content-Disposition",
            `attachment; filename="${filename}"`
        );
        res.setHeader("Content-Length", fileBuffer.length);
        res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
        res.setHeader("Pragma", "no-cache");
        res.setHeader("Expires", "0");

        // Send file buffer
        res.send(fileBuffer);
    })
);

export default router;
