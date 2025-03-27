import express from "express";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import { checkAccess } from "@/middleware/auth.ts";
import db from "@/config/db/index.ts";
import { phd } from "@/config/db/schema/admin.ts";
import { phdQualifyingExams, phdSemesters } from "@/config/db/schema/phd.ts";
import { sql, eq, desc, gte,and } from "drizzle-orm";
import z from "zod";
import { HttpError, HttpCode } from "@/config/errors.ts";

const router = express.Router();

// Schema for generating form data
const generateFormSchema = z.object({
  studentEmails: z.array(z.string().email()).optional(),
  examStartDate: z.string().optional(),
  examEndDate: z.string().optional(),
  roomNumber: z.string().optional(),
});

router.get(
  "/",
  checkAccess(),
  asyncHandler(async (req, res, next) => {
    // Get current date
    const currentDate = new Date();
    
    // Get the current active qualifying exam
    const activeExam = await db
      .select({
        id: phdQualifyingExams.id,
        examName: phdQualifyingExams.examName,
        deadline: phdQualifyingExams.deadline,
        semesterId: phdQualifyingExams.semesterId,
        semesterYear: phdSemesters.year,
        semesterNumber: phdSemesters.semesterNumber,
      })
      .from(phdQualifyingExams)
      .innerJoin(
        phdSemesters,
        eq(phdQualifyingExams.semesterId, phdSemesters.id)
      )
      .where(and(gte(phdQualifyingExams.deadline, currentDate), eq(phdQualifyingExams.examName, "Regular Qualifying Exam")))
      .orderBy(desc(phdQualifyingExams.deadline))
      .limit(1);

      if (!activeExam.length) {
        return next(new HttpError(
          HttpCode.NOT_FOUND, 
          "No active qualifying exam deadline found",
          "Please check the current semester's exam schedule"
        ));
      }

    const { deadline } = activeExam[0];
    
    // Look for students who have updated their qualifying areas in preparation for the exam
    // Using a time window of approximately 1-3 months before the deadline
    const threeMonthsBeforeDeadline = new Date(deadline);
    threeMonthsBeforeDeadline.setMonth(threeMonthsBeforeDeadline.getMonth() - 3);
    
    // Check if we're generating form data
    const { studentEmails, examStartDate, examEndDate, roomNumber } = req.query;
    
    // Parse the query parameters if they exist
    let formData = null;
    if (studentEmails && examEndDate && roomNumber) {
      try {
        const parsedEmails = JSON.parse(studentEmails as string);
        const parsedQuery = generateFormSchema.parse({
          studentEmails: parsedEmails,
          examStartDate: examStartDate || examEndDate,
          examEndDate,
          roomNumber
        });
        
        // Fetch only the selected students
        const selectedStudents = await db
          .select({
            name: phd.name,
            email: phd.email,
            area1: phd.qualifyingArea1,
            area2: phd.qualifyingArea2,
            idNumber: phd.idNumber,
            numberOfQeApplication: phd.numberOfQeApplication,
          })
          .from(phd)
          .where(sql`${phd.email} IN (${parsedQuery.studentEmails})`);
        
        formData = {
          students: selectedStudents,
          examStartDate: parsedQuery.examStartDate,
          examEndDate: parsedQuery.examEndDate,
          roomNumber: parsedQuery.roomNumber
        };
      } catch (error) {
        console.error("Error parsing form data:", error);
      }
    }
    
    // Get all eligible students
    const students = await db
      .select({
        name: phd.name,
        email: phd.email,
        area1: phd.qualifyingArea1,
        area2: phd.qualifyingArea2,
        idNumber: phd.idNumber,
        numberOfQeApplication: phd.numberOfQeApplication,
      })
      .from(phd)
      .where(
        sql`${phd.qualifyingAreasUpdatedAt}>=${threeMonthsBeforeDeadline}
        AND ${phd.qualifyingAreasUpdatedAt}<=${deadline}`
      );

    res.status(200).json({ 
      success: true, 
      students,
      examInfo: activeExam[0],
      formData
    });
  })
);

export default router;