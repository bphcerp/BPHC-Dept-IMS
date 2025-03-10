import express from "express";
import assert from "assert";
import db from "@/config/db/index.ts";
import { checkAccess } from "@/middleware/auth.ts";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import { courseHandoutRequests } from "@/config/db/schema/handout.ts";
import { applications, applicationStatus, textFields } from "@/config/db/schema/form.ts";
import { eq, inArray } from "drizzle-orm";
import z from "zod";

const router = express.Router();

const getApplicationFacultyBodySchema = z.object({
    applicationId: z.string().transform((val) => parseInt(val, 10)),
});

interface ApplicationFaculty {
    applicationId: number;
    courseCode: string;
    courseName: string;
    openBook: string;
    closedBook: string;
    midSem: string;
    compre: string;
    frequency: string;
    numComponents: string;
    status: string;
}

router.get(
    "/",
    checkAccess("ic"),
    asyncHandler(async (req, res, _next) => {
        assert(req.user);

        try {
            const parsed = getApplicationFacultyBodySchema.parse(req.query);
            const { applicationId } = parsed;

            const applicationResult = await db
                .select()
                .from(applications)
                .leftJoin(
                    applicationStatus,
                    eq(applicationStatus.applicationId, applications.id)
                )
                .leftJoin(
                    courseHandoutRequests,
                    eq(courseHandoutRequests.applicationId, applications.id)
                )
                .where(eq(applications.id, applicationId));

            if (applicationResult.length === 0) {
                res.status(404).json({ 
                    success: false, 
                    message: "Application not found" 
                });
                return;
            }

            const application = applicationResult[0];
            const handoutRequest = application.course_handout_requests;
            
            const result: ApplicationFaculty = {
                applicationId: application.applications.id,
                courseCode: "",
                courseName: "",
                openBook: "",
                closedBook: "",
                midSem: "",
                compre: "",
                frequency: "",
                numComponents: "",
                status: application.application_status === null 
                    ? "Not Verified" 
                    : "Marked for Resubmission"
            };

            if (handoutRequest) {
                const fieldIds = [
                    handoutRequest.courseCode,
                    handoutRequest.courseName,
                    handoutRequest.openBook,
                    handoutRequest.closedBook,
                    handoutRequest.midSem,
                    handoutRequest.compre,
                    handoutRequest.frequency,
                    handoutRequest.numComponents
                ].filter(Boolean) as number[];
                
                if (fieldIds.length > 0) {
                    const textFieldResults = await db
                        .select()
                        .from(textFields)
                        .where(inArray(textFields.id, fieldIds));
                    
                    const fieldMap = new Map(
                        textFieldResults.map(field => [field.id, field.value])
                    );
                    
                    if (handoutRequest.courseCode) 
                        result.courseCode = fieldMap.get(handoutRequest.courseCode) ?? "";
                    
                    if (handoutRequest.courseName) 
                        result.courseName = fieldMap.get(handoutRequest.courseName) ?? "";
                    
                    if (handoutRequest.openBook) 
                        result.openBook = fieldMap.get(handoutRequest.openBook) ?? "";
                    
                    if (handoutRequest.closedBook) 
                        result.closedBook = fieldMap.get(handoutRequest.closedBook) ?? "";
                    
                    if (handoutRequest.midSem) 
                        result.midSem = fieldMap.get(handoutRequest.midSem) ?? "";
                    
                    if (handoutRequest.compre) 
                        result.compre = fieldMap.get(handoutRequest.compre) ?? "";
                    
                    if (handoutRequest.frequency) 
                        result.frequency = fieldMap.get(handoutRequest.frequency) ?? "";
                    
                    if (handoutRequest.numComponents) 
                        result.numComponents = fieldMap.get(handoutRequest.numComponents) ?? "";
                }
            }

            res.status(200).json({ success: true, result });
        } catch (error) {
            console.error("Error fetching application:", error);
            res.status(400).json({ 
                success: false, 
                message: error instanceof z.ZodError 
                    ? "Invalid application ID" 
                    : "Failed to fetch application details" 
            });
        }
    })
);

export default router;
