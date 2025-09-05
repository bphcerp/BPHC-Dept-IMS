import express from "express";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import { checkAccess } from "@/middleware/auth.ts";
import { HttpError, HttpCode } from "@/config/errors.ts";
import db from "@/config/db/index.ts";
import { phdExamTimetableSlots } from "@/config/db/schema/phd.ts";
import { eq } from "drizzle-orm";

const router = express.Router();

export default router.get(
  "/:examId",
  checkAccess("phd:drc:qe"),
  asyncHandler(async (req, res, next) => {
    const examId = parseInt(req.params.examId);
    if (isNaN(examId)) {
      return next(new HttpError(HttpCode.BAD_REQUEST, "Invalid Exam ID"));
    }

    const slots = await db.query.phdExamTimetableSlots.findMany({
      where: eq(phdExamTimetableSlots.examId, examId),
      with: {
        student: {
          columns: {
            name: true,
          },
        },
      },
    });

    const timetable = {
      slot1: slots.filter((s) => s.slotNumber === 1),
      slot2: slots.filter((s) => s.slotNumber === 2),
      unscheduled: slots.filter((s) => s.slotNumber === 0),
    };

    const examinerDuties = slots.reduce(
      (acc, slot) => {
        if (slot.slotNumber > 0) {
          if (!acc[slot.examinerEmail]) {
            acc[slot.examinerEmail] = new Set();
          }
          acc[slot.examinerEmail].add(slot.slotNumber);
        }
        return acc;
      },
      {} as Record<string, Set<number>>,
    );

    const examinersWithDoubleDuty = Object.entries(examinerDuties)
      .filter(([, dutySlots]) => dutySlots.size > 1)
      .map(([examinerEmail]) => examinerEmail);

    res.status(200).json({ timetable, examinersWithDoubleDuty });
  }),
);