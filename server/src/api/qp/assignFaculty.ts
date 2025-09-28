import express from "express";
import db from "@/config/db/index.ts";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import { qpSchemas } from "lib";
import { qpReviewRequests } from "@/config/db/schema/qp.ts";
import { users } from "@/config/db/schema/admin.ts";
import { HttpCode, HttpError } from "@/config/errors.ts";
import { eq } from "drizzle-orm";
// FIX: Import with a different name to avoid conflicts
import { sendEmail as sendEmailFunction } from "@/lib/common/email.ts";
import { checkAccess } from "@/middleware/auth.ts";

const router = express.Router();

// Function to generate HTML email template for reviewer assignment
function generateReviewerAssignmentTemplate(
    reviewerName: string | null,
    courseDetails: {
        courseName?: string;
        courseCode?: string;
        requestType?: string;
        instructorName?: string;
    }
): string {
    const displayName = reviewerName || "Dear Reviewer";
    const currentDate = new Date().toLocaleDateString("en-IN", {
        year: "numeric",
        month: "long",
        day: "numeric",
    });

    return `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Question Paper Review Assignment</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
                <h1 style="color: #1e40af; margin: 0; font-size: 24px;">Question Paper Review Assignment</h1>
                <p style="margin: 10px 0 0 0; color: #6b7280;">BITS Pilani Hyderabad Campus</p>
            </div>

            <div style="background-color: white; padding: 20px; border-radius: 8px; border: 1px solid #e5e7eb;">
                <p style="margin-top: 0;"><strong>${displayName},</strong></p>
                
                <p>You have been assigned as a reviewer for a question paper review request. Below are the details of your assignment:</p>

                <div style="background-color: #f3f4f6; padding: 15px; border-radius: 6px; margin: 20px 0;">
                    <h3 style="margin: 0 0 10px 0; color: #1e40af;">Course Details</h3>
                    ${courseDetails.courseCode ? `<p style="margin: 5px 0;"><strong>Course Code:</strong> ${courseDetails.courseCode}</p>` : ''}
                    ${courseDetails.courseName ? `<p style="margin: 5px 0;"><strong>Course Name:</strong> ${courseDetails.courseName}</p>` : ''}
                    ${courseDetails.requestType ? `<p style="margin: 5px 0;"><strong>Request Type:</strong> ${courseDetails.requestType}</p>` : ''}
                    ${courseDetails.instructorName ? `<p style="margin: 5px 0;"><strong>Instructor:</strong> ${courseDetails.instructorName}</p>` : ''}
                </div>

                <div style="background-color: #eff6ff; padding: 15px; border-radius: 6px; border-left: 4px solid #1e40af; margin: 20px 0;">
                    <p style="margin: 0; font-weight: bold; color: #1e40af;">📝 Action Required</p>
                    <p style="margin: 5px 0 0 0; color: #1e3a8a;">Please access the review portal to complete your assignment once the question papers are submitted by the instructor.</p>
                </div>

                <div style="margin: 25px 0;">
                    <a href="${process.env.FRONTEND_URL || "https://your-app-url.com"}/qpReview/faculty" 
                       style="
                           display: inline-block; 
                           background-color: #1e40af; 
                           color: white; 
                           padding: 12px 24px; 
                           text-decoration: none; 
                           border-radius: 6px; 
                           font-weight: bold;
                           text-align: center;
                       ">
                        Access Review Portal
                    </a>
                </div>

                <p style="color: #6b7280; font-size: 14px; margin-bottom: 0;">
                    If you have any questions about this assignment or need assistance, please contact the DCA Convenor or the examination office.
                </p>
            </div>

            <div style="margin-top: 20px; padding: 15px; background-color: #f9fafb; border-radius: 6px; text-align: center;">
                <p style="margin: 0; font-size: 12px; color: #6b7280;">
                    This is an automated notification from the Question Paper Review System<br>
                    Date: ${currentDate} | BITS Pilani Hyderabad Campus
                </p>
            </div>
        </body>
        </html>
    `;
}

router.post(
    "/",
    checkAccess(),
    asyncHandler(async (req, res, next) => {
        console.log("=== ASSIGN REVIEWER API CALLED ===");
        console.log("Request body:", JSON.stringify(req.body, null, 2));

        try {
            // Parse request body
            const parsed = qpSchemas.assignReviewerBodySchema.parse(req.body);
            const { id, reviewerEmail } = parsed;
            
            // Get sendEmail directly from req.body since it might not be in the schema
            const sendEmailFromBody = req.body.sendEmail;
            const sendEmail = parsed.sendEmail || sendEmailFromBody;

            console.log("Parsed data:", {
                id,
                reviewerEmail,
                sendEmail,
                sendEmailType: typeof sendEmail,
                sendEmailFromBody,
                sendEmailFromBodyType: typeof sendEmailFromBody
            });

            // Check if reviewer exists
            console.log("Checking if reviewer exists with email:", reviewerEmail);
            const reviewerExists = await db.query.users.findFirst({
                where: eq(users.email, reviewerEmail),
            });

            console.log("Reviewer exists:", reviewerExists ? "Yes" : "No");
            if (reviewerExists) {
                console.log("Reviewer details:", {
                    id: reviewerExists.id,
                    name: reviewerExists.name,
                    email: reviewerExists.email
                });
            }

            if (!reviewerExists) {
                console.log("ERROR: Reviewer not found");
                return next(
                    new HttpError(HttpCode.NOT_FOUND, "Reviewer does not exist")
                );
            }

            // Get the review request with all details
            console.log("Fetching review request with ID:", id);
            const reviewRequest = await db.query.qpReviewRequests.findFirst({
                where: eq(qpReviewRequests.id, Number(id)),
            });

            console.log("Review request found:", reviewRequest ? "Yes" : "No");
            if (reviewRequest) {
                console.log("Review request details:", {
                    id: reviewRequest.id,
                    courseName: reviewRequest.courseName || 'Not available',
                    courseCode: reviewRequest.courseCode || 'Not available',
                    requestType: reviewRequest.requestType || 'Not available',
                    status: reviewRequest.status || 'Not available'
                });
            }

            if (!reviewRequest) {
                console.log("ERROR: Review request not found");
                return next(
                    new HttpError(HttpCode.NOT_FOUND, "QP review request not found")
                );
            }

            // Update the review request with reviewer email
            console.log("Updating review request with reviewer email:", reviewerEmail);
            const updatedRequest = await db
                .update(qpReviewRequests)
                .set({
                    reviewerEmail: reviewerEmail, 
                })
                .where(eq(qpReviewRequests.id, Number(id)))
                .returning();

            console.log("Review request updated successfully:", updatedRequest[0] ? "Yes" : "No");

            // Email notification logic
            console.log("=== EMAIL NOTIFICATION SECTION ===");
            console.log("sendEmail value:", sendEmail);
            console.log("sendEmail type:", typeof sendEmail);
            console.log("sendEmail === true:", sendEmail === true);
            console.log("sendEmail === 'true':", sendEmail === 'true');
            console.log("Boolean(sendEmail):", Boolean(sendEmail));

            // FIX: Add debugging for the function import
            console.log("sendEmailFunction type:", typeof sendEmailFunction);
            console.log("sendEmailFunction exists:", !!sendEmailFunction);

            let emailSent = false;
            let emailError = null;

            // Check both boolean true and string "true"
            if (sendEmail === true || sendEmail === "true" || sendEmail === 1) {
                console.log("EMAIL CONDITION MET - Proceeding with email sending");
                
                try {
                    console.log("Preparing course details for email...");
                    const courseDetails = {
                        courseName: reviewRequest.courseName || undefined,
                        courseCode: reviewRequest.courseCode || undefined,
                        requestType: reviewRequest.requestType || undefined,
                        instructorName: reviewRequest.instructorName || undefined,
                    };

                    console.log("Course details prepared:", courseDetails);

                    const emailSubject = `Question Paper Review Assignment${courseDetails.courseCode ? ` - ${courseDetails.courseCode}` : ''}`;
                    console.log("Email subject:", emailSubject);

                    const emailOptions = {
                        to: reviewerEmail,
                        subject: emailSubject,
                        html: generateReviewerAssignmentTemplate(reviewerExists.name || null, courseDetails),
                        text: `
Dear ${reviewerExists.name || 'Reviewer'},

You have been assigned as a reviewer for a question paper review request.

Course Details:
${courseDetails.courseCode ? `- Course Code: ${courseDetails.courseCode}` : ''}
${courseDetails.courseName ? `- Course Name: ${courseDetails.courseName}` : ''}
${courseDetails.requestType ? `- Request Type: ${courseDetails.requestType}` : ''}
${courseDetails.instructorName ? `- Instructor: ${courseDetails.instructorName}` : ''}

Please access the review portal to complete your assignment once the question papers are submitted by the instructor.

Review Portal: ${process.env.FRONTEND_URL || "https://your-app-url.com"}/qpReview/faculty

If you have any questions about this assignment, please contact the DCA Convenor or the examination office.

Best regards,
DCA Convenor
BITS Pilani Hyderabad Campus
                        `.trim(),
                        priority: "normal" as const,
                    };

                    console.log("Email options prepared:");
                    console.log("- To:", emailOptions.to);
                    console.log("- Subject:", emailOptions.subject);
                    console.log("- Priority:", emailOptions.priority);

                    // FIX: Use the renamed import
                    console.log("Calling sendEmailFunction...");
                    const emailResult = await sendEmailFunction(emailOptions);
                    console.log("sendEmailFunction completed");
                    console.log("Email result:", emailResult);
                    
                    emailSent = true;
                    console.log("✅ Assignment notification email sent successfully to:", reviewerEmail);
                    
                } catch (error) {
                    emailError = error;
                    console.error("❌ Error sending assignment notification email:");
                    console.error("Error message:", error?.message);
                    console.error("Error stack:", error?.stack);
                    
                    // Don't fail the main operation if email fails
                    console.log("Continuing with API response despite email error...");
                }
            } else {
                console.log("EMAIL CONDITION NOT MET");
                console.log("sendEmail is:", sendEmail);
                console.log("Email will not be sent");
            }

            // Prepare response
            const responseMessage = emailSent 
                ? "Reviewer assigned successfully and notification email sent"
                : emailError 
                    ? "Reviewer assigned successfully but email notification failed"
                    : "Reviewer assigned successfully";

            console.log("=== API RESPONSE ===");
            console.log("Response message:", responseMessage);
            console.log("Email sent:", emailSent);
            console.log("Email error:", emailError ? "Yes" : "No");

            res.status(200).json({
                success: true,
                message: responseMessage,
                data: {
                    reviewRequest: updatedRequest[0],
                    emailSent: emailSent,
                    emailError: emailError ? emailError.message : null
                },
            });

        } catch (error) {
            console.error("=== API ERROR ===");
            console.error("Error type:", error.constructor.name);
            console.error("Error message:", error.message);
            console.error("Error stack:", error.stack);
            
            // If it's a validation error from zod
            if (error.name === 'ZodError') {
                console.error("Zod validation errors:", error.errors);
                return next(new HttpError(HttpCode.BAD_REQUEST, "Invalid request data", error.errors));
            }
            
            return next(error);
        }
    })
);

export default router;
