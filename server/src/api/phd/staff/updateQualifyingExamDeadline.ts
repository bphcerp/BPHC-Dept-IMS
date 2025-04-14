import express from "express";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import { checkAccess } from "@/middleware/auth.ts";
import { HttpError, HttpCode } from "@/config/errors.ts";
import db from "@/config/db/index.ts";
import { phdSemesters, phdQualifyingExams } from "@/config/db/schema/phd.ts";
import { users } from "@/config/db/schema/admin.ts";
import { notifications } from "@/config/db/schema/todos.ts";
import { eq, and, gt } from "drizzle-orm";
import { phdSchemas } from "lib";
import assert from "assert";

const router = express.Router();

export default router.post(
    "/",
    checkAccess(),
    asyncHandler(async (req, res) => {
        assert(req.user, "User should be defined");

        const parsed = phdSchemas.updateQualifyingExamSchema.parse(req.body);
        const {
            semesterId,
            examName,
            examStartDate,
            examEndDate,
            deadline,
            viva,
        } = parsed;

        // Fetch semester info
        const semester = await db
            .select()
            .from(phdSemesters)
            .where(eq(phdSemesters.id, semesterId))
            .limit(1);

        if (semester.length === 0) {
            throw new HttpError(HttpCode.NOT_FOUND, "Semester not found");
        }

        if (!examStartDate || !examEndDate || !deadline) {
            throw new HttpError(
                HttpCode.BAD_REQUEST,
                "All dates must be provided"
            );
        }

        // Check for existing active exams
        const existingActiveExams = await db
            .select()
            .from(phdQualifyingExams)
            .where(
                and(
                    eq(phdQualifyingExams.semesterId, semesterId),
                    eq(phdQualifyingExams.examName, examName),
                    gt(phdQualifyingExams.deadline, new Date())
                )
            );

        if (existingActiveExams.length > 0) {
            throw new HttpError(
                HttpCode.BAD_REQUEST,
                "An active exam deadline already exists for this semester. Please cancel the existing deadline first."
            );
        }

        // Parse dates
        const deadlineDate = new Date(deadline);
        const startDate = new Date(examStartDate);
        const endDate = new Date(examEndDate);
        const vivaDate = new Date(viva);

        // Validate date sequences
        if (deadlineDate >= startDate) {
            throw new HttpError(
                HttpCode.BAD_REQUEST,
                "Registration deadline must be before exam start date"
            );
        }

        if (startDate >= endDate) {
            throw new HttpError(
                HttpCode.BAD_REQUEST,
                "Exam start date must be before exam end date"
            );
        }

        if (endDate >= vivaDate) {
            throw new HttpError(
                HttpCode.BAD_REQUEST,
                "Viva date must be after exam end date"
            );
        }

        // Create new qualifying exam
        const newExam = await db
            .insert(phdQualifyingExams)
            .values({
                semesterId,
                examName,
                examStartDate: startDate,
                examEndDate: endDate,
                deadline: deadlineDate,
                vivaDate: vivaDate,
            })
            .returning();

        // Format dates for notification
        const formatDate = (date: Date) =>
            date.toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
            });

        const formattedDeadline = formatDate(deadlineDate);
        const formattedStartDate = formatDate(startDate);
        const formattedEndDate = formatDate(endDate);
        const formattedVivaDate = formatDate(vivaDate);

        // Fetch all users to notify
        const allUsers = await db.select({ email: users.email }).from(users);

        // Create notification content
        const notificationContent = `
    A new PhD Qualifying Exam "${examName}" has been scheduled:
    • Registration Deadline: ${formattedDeadline}
    • Exam Start: ${formattedStartDate}
    • Exam End: ${formattedEndDate}
    • Viva Date: ${formattedVivaDate}
    
    For Semester: ${semester[0].year}-${semester[0].semesterNumber}
  `.trim();

        // Create notifications for all users
        const notificationPromises = allUsers.map((user) =>
            db.insert(notifications).values({
                module: "PhD Qe Application",
                title: `New PhD Qualifying Exam: ${examName}`,
                content: notificationContent,
                userEmail: user.email,
                createdAt: new Date(),
                read: false,
            })
        );

        // Wait for all notifications to be created
        await Promise.all(notificationPromises);

        res.status(201).json({
            success: true,
            message:
                "Qualifying exam created successfully and notifications sent",
            exam: newExam[0],
        });
    })
);
