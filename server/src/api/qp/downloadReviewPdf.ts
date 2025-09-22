import { asyncHandler } from '@/middleware/routeHandler.ts';
import express from 'express';
import { generateSingleReviewPDF, generateReviewsZip, generateMultipleReviewsPDF } from './functions/creteReviewPdf.ts';

const router = express.Router();

router.post("/", asyncHandler(async (req, res) => {
    try {
        console.log("Received request body with", req.body?.length || 0, "items");
        
        // Validate that request body is an array of review objects
        if (!Array.isArray(req.body)) {
            return res.status(400).json({ 
                success: false, 
                message: "Request body must be an array of review objects" 
            });
        }

        if (req.body.length === 0) {
            return res.status(400).json({ 
                success: false, 
                message: "No review data provided" 
            });
        }

        // Validate required fields in each review object
        const requiredFields = ['id', 'courseName', 'courseCode', 'review', 'icEmail', 'reviewerEmail'];
        const isValidData = req.body.every((review: any) => 
            requiredFields.every(field => review.hasOwnProperty(field))
        );

        if (!isValidData) {
            return res.status(400).json({ 
                success: false, 
                message: "Invalid review data structure. Missing required fields." 
            });
        }

        const reviewRequests = req.body;
        const courseCount = reviewRequests.length;
        
        console.log(`Processing ${courseCount} course(s) for download...`);

        let fileBuffer: Buffer;
        let filename: string;
        let contentType: string;

        if (courseCount === 1) {
            // Single course - generate single PDF
            console.log(`Generating single PDF for ${reviewRequests[0].courseCode}...`);
            fileBuffer = await generateSingleReviewPDF(reviewRequests[0]);
            
            const courseCode = reviewRequests[0].courseCode;
            const courseName = reviewRequests[0].courseName.replace(/[^a-zA-Z0-9]/g, '_');
            filename = `${courseCode}-${courseName}-Review.pdf`;
            contentType = 'application/pdf';
            
            console.log(`Single PDF generated: ${filename}`);
        } else {
            // Multiple courses - generate ZIP with individual PDFs
            console.log(`Generating ZIP with ${courseCount} individual PDFs...`);
            fileBuffer = await generateReviewsZip(reviewRequests);
            
            const timestamp = new Date().toISOString().split('T')[0];
            filename = `reviews-${courseCount}-courses-${timestamp}.zip`;
            contentType = 'application/zip';
            
            console.log(`ZIP file generated: ${filename} (${fileBuffer.length} bytes)`);
        }

        // Set response headers for file download
        res.setHeader('Content-Type', contentType);
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.setHeader('Content-Length', fileBuffer.length);
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');

        // Send file buffer
        res.send(fileBuffer);

    } catch (error) {
        console.error("Error generating review files:", error);
        
        // Send error response
        res.status(500).json({ 
            success: false, 
            message: "Failed to generate review files",
            error: error instanceof Error ? error.message : "Unknown error"
        });
    }
}));

// Optional: GET route for testing
router.get("/test", asyncHandler(async (req, res) => {
    res.status(200).json({ 
        success: true, 
        message: "PDF download endpoint is working",
        usage: {
            method: "POST",
            body: "Array of review objects",
            response: "Single PDF for 1 course, ZIP with multiple PDFs for multiple courses"
        }
    });
}));

export default router;
