import express from "express";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import { checkAccess } from "@/middleware/auth.ts";
import db from "@/config/db/index.ts";
import { phdExamEvents, phdSemesters, phdWorkflowStates } from "@/config/db/schema/phd.ts";
import { HttpError, HttpCode } from "@/config/errors.ts";
import { eq, desc } from "drizzle-orm";
import { phdSchemas, permissions } from "lib";

const router = express.Router();

router.post(
  "/",
  checkAccess(),
  asyncHandler(async (req, res, next) => {
    const parsed = phdSchemas.createExamEventSchema.parse(req.body);

    // ✅ CORRECTED: All dates are now required and converted directly
    const registrationDeadline = new Date(parsed.registrationDeadline);
    const examStartDate = new Date(parsed.examStartDate);
    const examEndDate = new Date(parsed.examEndDate);
    const vivaDate = new Date(parsed.vivaDate);

    const semester = await db.query.phdSemesters.findFirst({
      where: (semesters, { eq }) => eq(semesters.id, parsed.semesterId),
    });
    
    if (!semester) {
      return next(new HttpError(HttpCode.NOT_FOUND, "Semester not found"));
    }

    if (registrationDeadline >= examStartDate) {
      return next(new HttpError(HttpCode.BAD_REQUEST, "Registration deadline must be before exam start date"));
    }

    if (examStartDate >= examEndDate) {
      return next(new HttpError(HttpCode.BAD_REQUEST, "Exam start date must be before exam end date"));
    }

    const examEvent = await db.transaction(async (tx) => {
      const [newEvent] = await tx.insert(phdExamEvents).values({
          type: parsed.type,
          name: parsed.name,
          semesterId: parsed.semesterId,
          registrationDeadline,
          examStartDate,
          examEndDate,
          vivaDate,
        }).returning();

      await tx.insert(phdWorkflowStates).values({
        examEventId: newEvent.id,
        stage: 'applications_open',
        status: 'in_progress',
        startedAt: new Date(),
      });

      return newEvent;
    });

    res.status(201).json({
      success: true,
      examEvent,
    });
  }),
);

// ... (rest of the file remains the same)
router.get(
  "/semester/:semesterId",
  checkAccess(),
  asyncHandler(async (req, res) => {
    const semesterId = parseInt(req.params.semesterId);
    
    const events = await db.query.phdExamEvents.findMany({
      where: eq(phdExamEvents.semesterId, semesterId),
      orderBy: [desc(phdExamEvents.createdAt)],
    });
    
    res.status(200).json({
      success: true,
      examEvents: events,
    });
  }),
);

router.delete(
  "/:eventId",
  checkAccess(),
  asyncHandler(async (req, res, next) => {
    const eventId = parseInt(req.params.eventId);
    
    const event = await db.query.phdExamEvents.findFirst({
      where: eq(phdExamEvents.id, eventId),
    });
    
    if (!event) {
      return next(new HttpError(HttpCode.NOT_FOUND, "Exam event not found"));
    }

    await db.update(phdExamEvents)
      .set({ 
        isActive: false,
        updatedAt: new Date(),
      })
      .where(eq(phdExamEvents.id, eventId));

    res.status(200).json({
      success: true,
      message: `Exam event with ID ${eventId} has been deactivated.`,
    });
  }),
);

export default router;