import express from "express";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import { checkAccess } from "@/middleware/auth.ts";
import { HttpError, HttpCode } from "@/config/errors.ts";
import db from "@/config/db/index.ts";
import { phdSchemas } from "lib";
import { phdExamTimetableSlots } from "@/config/db/schema/phd.ts";
import { eq } from "drizzle-orm";

const router = express.Router();

router.post(
  "/:examId",
  checkAccess("phd:drc:qe"),
  asyncHandler(async (req, res, next) => {
    const examId = parseInt(req.params.examId);
    if (isNaN(examId)) {
      return next(new HttpError(HttpCode.BAD_REQUEST, "Invalid Exam ID"));
    }

    const { timetable } = phdSchemas.updateTimetableSchema.parse(req.body);

    const allScheduledItems = [...timetable.slot1, ...timetable.slot2];

    const studentSlotMap: Record<string, number[]> = {};
    for (const item of allScheduledItems) {
        if (!studentSlotMap[item.studentEmail]) {
            studentSlotMap[item.studentEmail] = [];
        }
        studentSlotMap[item.studentEmail].push(item.slotNumber);
    }

    for (const [student, slots] of Object.entries(studentSlotMap)) {
        if (new Set(slots).size < slots.length) {
            return next(new HttpError(HttpCode.BAD_REQUEST, `Student ${student} is scheduled for two exams in the same slot.`));
        }
    }

    const allItemsToInsert = [...timetable.slot1, ...timetable.slot2, ...timetable.unscheduled];

    await db.transaction(async (tx) => {
      await tx.delete(phdExamTimetableSlots).where(eq(phdExamTimetableSlots.examId, examId));
      
      if (allItemsToInsert.length > 0) {
        await tx.insert(phdExamTimetableSlots).values(
          allItemsToInsert.map((item) => ({
            examId,
            studentEmail: item.studentEmail,
            qualifyingArea: item.qualifyingArea,
            examinerEmail: item.examinerEmail,
            slotNumber: item.slotNumber,
          })),
        );
      }
    });

    res.status(200).json({ success: true, message: "Timetable updated successfully." });
  }),
);

export default router;