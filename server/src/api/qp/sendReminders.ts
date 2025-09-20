import express from "express";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import { sendEmail } from "@/lib/common/email.ts";
import { createLogger } from "winston";

const router = express.Router();
const logger = createLogger();

interface ReminderEmailData {
    selectedCourseIds: string[];
    recipientCount: number;
    courses: Array<{
        id: string;
        icEmail: string | null;
        courseName: string;
        courseCode: string;
        reviewerEmail: string;
        reviewerName: string | null;
        status: string;
        requestType: string;
    }>;
}

// Function to generate HTML email template for instructors (documents not submitted)
function generateInstructorReminderTemplate(
    instructorName: string | null,
    courses: Array<{
        courseName: string;
        courseCode: string;
        status: string;
        requestType: string;
    }>
): string {
    const displayName = instructorName || "Dear Instructor";
    const currentDate = new Date().toLocaleDateString("en-IN", {
        year: "numeric",
        month: "long",
        day: "numeric",
    });

    const coursesTable = courses
        .map(
            (course) => `
        <tr style="border-bottom: 1px solid #e5e7eb;">
            <td style="padding: 12px; text-align: left;">${course.courseCode}</td>
            <td style="padding: 12px; text-align: left;">${course.courseName}</td>
            <td style="padding: 12px; text-align: left;">${course.requestType}</td>
            <td style="padding: 12px; text-align: left;">
                <span style="
                    padding: 4px 8px; 
                    border-radius: 4px; 
                    font-size: 12px; 
                    font-weight: bold;
                    background-color: #fee2e2;
                    color: #dc2626;
                ">
                    ${course.status.toUpperCase()}
                </span>
            </td>
        </tr>
    `
        )
        .join("");

    return `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Document Submission Reminder</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
                <h1 style="color: #dc2626; margin: 0; font-size: 24px;">Document Submission Reminder</h1>
                <p style="margin: 10px 0 0 0; color: #6b7280;">BITS Pilani Hyderabad Campus</p>
            </div>

            <div style="background-color: white; padding: 20px; border-radius: 8px; border: 1px solid #e5e7eb;">
                <p style="margin-top: 0;"><strong>${displayName},</strong></p>
                
                <p>This is a reminder regarding your pending document submissions for question paper review. The following courses require document submission:</p>

                <div style="margin: 20px 0;">
                    <table style="width: 100%; border-collapse: collapse; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden;">
                        <thead>
                            <tr style="background-color: #f3f4f6;">
                                <th style="padding: 12px; text-align: left; font-weight: bold; border-bottom: 2px solid #e5e7eb;">Course Code</th>
                                <th style="padding: 12px; text-align: left; font-weight: bold; border-bottom: 2px solid #e5e7eb;">Course Name</th>
                                <th style="padding: 12px; text-align: left; font-weight: bold; border-bottom: 2px solid #e5e7eb;">Request Type</th>
                                <th style="padding: 12px; text-align: left; font-weight: bold; border-bottom: 2px solid #e5e7eb;">Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${coursesTable}
                        </tbody>
                    </table>
                </div>

                <div style="background-color: #fef2f2; padding: 15px; border-radius: 6px; border-left: 4px solid #dc2626; margin: 20px 0;">
                    <p style="margin: 0; font-weight: bold; color: #dc2626;">📋 Document Submission Required</p>
                    <p style="margin: 5px 0 0 0; color: #991b1b;">Please submit your question papers and solutions to proceed with the review process.</p>
                </div>

                <div style="margin: 25px 0;">
                    <a href="${process.env.FRONTEND_URL || "https://your-app-url.com"}/qpReview/instructor" 
                       style="
                           display: inline-block; 
                           background-color: #dc2626; 
                           color: white; 
                           padding: 12px 24px; 
                           text-decoration: none; 
                           border-radius: 6px; 
                           font-weight: bold;
                           text-align: center;
                       ">
                        Submit Documents
                    </a>
                </div>

                <p style="color: #6b7280; font-size: 14px; margin-bottom: 0;">
                    If you have any questions or need assistance, please contact the DCA Convenor or the examination office.
                </p>
            </div>

            <div style="margin-top: 20px; padding: 15px; background-color: #f9fafb; border-radius: 6px; text-align: center;">
                <p style="margin: 0; font-size: 12px; color: #6b7280;">
                    This is an automated reminder from the Question Paper Review System<br>
                    Date: ${currentDate} | BITS Pilani Hyderabad Campus
                </p>
            </div>
        </body>
        </html>
    `;
}

// Function to generate HTML email template for reviewers (review not submitted)
function generateReviewerReminderTemplate(
    reviewerName: string | null,
    courses: Array<{
        courseName: string;
        courseCode: string;
        status: string;
        requestType: string;
    }>
): string {
    const displayName = reviewerName || "Dear Reviewer";
    const currentDate = new Date().toLocaleDateString("en-IN", {
        year: "numeric",
        month: "long",
        day: "numeric",
    });

    const coursesTable = courses
        .map(
            (course) => `
        <tr style="border-bottom: 1px solid #e5e7eb;">
            <td style="padding: 12px; text-align: left;">${course.courseCode}</td>
            <td style="padding: 12px; text-align: left;">${course.courseName}</td>
            <td style="padding: 12px; text-align: left;">${course.requestType}</td>
            <td style="padding: 12px; text-align: left;">
                <span style="
                    padding: 4px 8px; 
                    border-radius: 4px; 
                    font-size: 12px; 
                    font-weight: bold;
                    background-color: #fef3c7;
                    color: #d97706;
                ">
                    ${course.status.toUpperCase()}
                </span>
            </td>
        </tr>
    `
        )
        .join("");

    return `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Question Paper Review Reminder</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
                <h1 style="color: #1e40af; margin: 0; font-size: 24px;">Question Paper Review Reminder</h1>
                <p style="margin: 10px 0 0 0; color: #6b7280;">BITS Pilani Hyderabad Campus</p>
            </div>

            <div style="background-color: white; padding: 20px; border-radius: 8px; border: 1px solid #e5e7eb;">
                <p style="margin-top: 0;"><strong>${displayName},</strong></p>
                
                <p>This is a gentle reminder regarding your pending question paper review assignments. The following courses require your review:</p>

                <div style="margin: 20px 0;">
                    <table style="width: 100%; border-collapse: collapse; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden;">
                        <thead>
                            <tr style="background-color: #f3f4f6;">
                                <th style="padding: 12px; text-align: left; font-weight: bold; border-bottom: 2px solid #e5e7eb;">Course Code</th>
                                <th style="padding: 12px; text-align: left; font-weight: bold; border-bottom: 2px solid #e5e7eb;">Course Name</th>
                                <th style="padding: 12px; text-align: left; font-weight: bold; border-bottom: 2px solid #e5e7eb;">Request Type</th>
                                <th style="padding: 12px; text-align: left; font-weight: bold; border-bottom: 2px solid #e5e7eb;">Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${coursesTable}
                        </tbody>
                    </table>
                </div>

                <div style="background-color: #fef9e7; padding: 15px; border-radius: 6px; border-left: 4px solid #f59e0b; margin: 20px 0;">
                    <p style="margin: 0; font-weight: bold; color: #d97706;">⚠️ Review Required</p>
                    <p style="margin: 5px 0 0 0; color: #92400e;">Please complete your review assignments at your earliest convenience to avoid any delays in the examination process.</p>
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
                    If you have any questions or need assistance, please contact the DCA Convenor or the examination office.
                </p>
            </div>

            <div style="margin-top: 20px; padding: 15px; background-color: #f9fafb; border-radius: 6px; text-align: center;">
                <p style="margin: 0; font-size: 12px; color: #6b7280;">
                    This is an automated reminder from the Question Paper Review System<br>
                    Date: ${currentDate} | BITS Pilani Hyderabad Campus
                </p>
            </div>
        </body>
        </html>
    `;
}

// Function to send reminder emails based on status
async function sendReminderEmails(reminderData: ReminderEmailData): Promise<void> {
    try {
        // Separate courses by status type
        const documentsNotSubmitted = reminderData.courses.filter(course => 
            course.status === 'notsubmitted' || course.status === 'pending_documents'
        );
        
        const reviewsNotSubmitted = reminderData.courses.filter(course => 
            course.status === 'submitted' || course.status === 'pending_review'
        );

        const emailPromises: Promise<any>[] = [];

        // Group courses for instructors (documents not submitted)
        if (documentsNotSubmitted.length > 0) {
            const instructorGroups = new Map<string, Array<{
                courseName: string;
                courseCode: string;
                status: string;
                requestType: string;
                instructorName: string | null;
            }>>();

            documentsNotSubmitted.forEach((course) => {
                if (course.icEmail) {
                    if (!instructorGroups.has(course.icEmail)) {
                        instructorGroups.set(course.icEmail, []);
                    }
                    instructorGroups.get(course.icEmail)!.push({
                        courseName: course.courseName,
                        courseCode: course.courseCode,
                        status: course.status,
                        requestType: course.requestType,
                        instructorName: null, // You might want to add instructorName to the interface
                    });
                }
            });

            // Send emails to instructors
            const instructorEmails = Array.from(instructorGroups.entries()).map(
                async ([icEmail, courses]) => {
                    const courseCount = courses.length;

                    const emailOptions = {
                        to: icEmail,
                        subject: `Urgent: Document Submission Required (${courseCount} course${courseCount > 1 ? "s" : ""})`,
                        html: generateInstructorReminderTemplate(null, courses),
                        text: `
Dear Instructor,

This is an urgent reminder regarding pending document submissions for question paper review:

${courses.map((course) => `- ${course.courseCode}: ${course.courseName} (${course.requestType}) - Status: ${course.status.toUpperCase()}`).join("\n")}

Please submit your question papers and solutions immediately to avoid delays in the examination process.

Best regards,
DCA Convenor
BITS Pilani Hyderabad Campus
                        `.trim(),
                        priority: "high" as const,
                    };

                    return sendEmail(emailOptions);
                }
            );

            emailPromises.push(...instructorEmails);
        }

        // Group courses for reviewers (review not submitted)
        if (reviewsNotSubmitted.length > 0) {
            const reviewerGroups = new Map<string, Array<{
                courseName: string;
                courseCode: string;
                status: string;
                requestType: string;
                reviewerName: string | null;
            }>>();

            reviewsNotSubmitted.forEach((course) => {
                if (course.reviewerEmail) {
                    if (!reviewerGroups.has(course.reviewerEmail)) {
                        reviewerGroups.set(course.reviewerEmail, []);
                    }
                    reviewerGroups.get(course.reviewerEmail)!.push({
                        courseName: course.courseName,
                        courseCode: course.courseCode,
                        status: course.status,
                        requestType: course.requestType,
                        reviewerName: course.reviewerName,
                    });
                }
            });

            // Send emails to reviewers
            const reviewerEmails = Array.from(reviewerGroups.entries()).map(
                async ([reviewerEmail, courses]) => {
                    const reviewerName = courses[0]?.reviewerName;
                    const courseCount = courses.length;

                    const emailOptions = {
                        to: reviewerEmail,
                        subject: `Reminder: Question Paper Review Pending (${courseCount} course${courseCount > 1 ? "s" : ""})`,
                        html: generateReviewerReminderTemplate(reviewerName, courses),
                        text: `
Dear ${reviewerName || "Reviewer"},

This is a reminder regarding your pending question paper review assignments:

${courses.map((course) => `- ${course.courseCode}: ${course.courseName} (${course.requestType}) - Status: ${course.status.toUpperCase()}`).join("\n")}

Please complete your reviews at your earliest convenience by visiting the review portal.

Best regards,
DCA Convenor
BITS Pilani Hyderabad Campus
                        `.trim(),
                        priority: "normal" as const,
                    };

                    return sendEmail(emailOptions);
                }
            );

            emailPromises.push(...reviewerEmails);
        }

        await Promise.all(emailPromises);

        logger.info(
            `Reminder emails sent successfully: ${documentsNotSubmitted.length} to instructors, ${reviewsNotSubmitted.length} to reviewers`
        );
    } catch (error) {
        logger.error("Error sending reminder emails:", error);
        throw error;
    }
}

router.post(
    "/",
    asyncHandler(async (req: any, res: any) => {
        try {
            const reminderData: ReminderEmailData = req.body;

            console.log("Received reminder data:", reminderData);

            // Validate request data
            if (!reminderData.courses || reminderData.courses.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: "No courses provided for reminder emails",
                });
            }

            // Separate courses by type
            const documentsNotSubmitted = reminderData.courses.filter(course => 
                (course.status === 'notsubmitted' ) && course.icEmail
            );
            
            const reviewsNotSubmitted = reminderData.courses.filter(course => 
                (course.status === 'review pending') && course.reviewerEmail
            );

            const totalValidCourses = documentsNotSubmitted.length + reviewsNotSubmitted.length;

            if (totalValidCourses === 0) {
                return res.status(400).json({
                    success: false,
                    message: "No valid courses found for reminders",
                });
            }

            // Log the request data
            console.log("Reminder request received:", {
                selectedCourseIds: reminderData.selectedCourseIds,
                totalCourses: reminderData.courses.length,
                documentsNotSubmitted: documentsNotSubmitted.length,
                reviewsNotSubmitted: reviewsNotSubmitted.length,
                instructorEmails: documentsNotSubmitted.map(c => c.icEmail),
                reviewerEmails: reviewsNotSubmitted.map(c => c.reviewerEmail),
            });

            // Send reminder emails
            await sendReminderEmails(reminderData);

            return res.status(200).json({
                success: true,
                message: `Reminder emails sent: ${documentsNotSubmitted.length} to instructors, ${reviewsNotSubmitted.length} to reviewers`,
                data: {
                    instructorReminders: documentsNotSubmitted.length,
                    reviewerReminders: reviewsNotSubmitted.length,
                    totalSent: totalValidCourses,
                    courseIds: reminderData.selectedCourseIds,
                },
            });
        } catch (error) {
            logger.error("Error in send reminders endpoint:", error);
            return res.status(500).json({
                success: false,
                message: "Failed to send reminder emails",
                error: error instanceof Error ? error.message : "Unknown error",
            });
        }
    })
);

export default router;
