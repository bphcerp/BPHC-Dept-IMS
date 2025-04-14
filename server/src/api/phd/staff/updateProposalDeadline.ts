import express from "express";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import { checkAccess } from "@/middleware/auth.ts";
import { HttpError, HttpCode } from "@/config/errors.ts";
import db from "@/config/db/index.ts";
import { phdSemesters, phdQualifyingExams } from "@/config/db/schema/phd.ts";
import { users } from "@/config/db/schema/admin.ts";
import { notifications } from "@/config/db/schema/todos.ts";
import { eq, and, gt } from "drizzle-orm";
import assert from "assert";
import { phdSchemas } from "lib";

const router = express.Router();

export default router.post(
    "/",
    checkAccess(),
    asyncHandler(async (req, res) => {
        assert(req.body);
        assert(req.user, "User should be defined");

        const parsed = phdSchemas.updateProposalDeadlineSchema.parse(req.body);
        const { semesterId, deadline } = parsed;

        // Fetch semester info
        const semester = await db
            .select()
            .from(phdSemesters)
            .where(eq(phdSemesters.id, semesterId))
            .limit(1);

        if (semester.length === 0) {
            throw new HttpError(HttpCode.NOT_FOUND, "Semester not found");
        }

        const examName = "Thesis Proposal";

        // Check for existing active proposals
        const existingActiveProposals = await db
            .select()
            .from(phdQualifyingExams)
            .where(
                and(
                    eq(phdQualifyingExams.semesterId, semesterId),
                    eq(phdQualifyingExams.examName, examName),
                    gt(phdQualifyingExams.deadline, new Date())
                )
            );

        if (existingActiveProposals.length > 0) {
            throw new HttpError(
                HttpCode.BAD_REQUEST,
                "An active proposal deadline already exists for this semester. Please cancel the existing deadline first."
            );
        }

        // Create new proposal deadline
        const deadlineDate = new Date(deadline);
        const newProposal = await db
            .insert(phdQualifyingExams)
            .values({
                semesterId,
                examName,
                deadline: deadlineDate,
            })
            .returning();

        // Fetch all users to notify
        const allUsers = await db.select({ email: users.email }).from(users);

        // Format date for notification
        const formattedDate = deadlineDate.toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
        });

        // Create notifications for all users
        const notificationPromises = allUsers.map((user) =>
            db.insert(notifications).values({
                module: "PhD Proposal",
                title: "New PhD Thesis Proposal Deadline",
                content: `A new PhD thesis proposal deadline has been set for ${formattedDate} for the ${semester[0].year} Semester ${semester[0].semesterNumber}.`,
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
                "Proposal deadline created successfully and notifications sent",
            proposal: newProposal[0],
        });
    })
);
