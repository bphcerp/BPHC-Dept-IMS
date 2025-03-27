import express from "express";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import { checkAccess } from "@/middleware/auth.ts";
import { HttpError, HttpCode } from "@/config/errors.ts";
import db from "@/config/db/index.ts";
import { phd } from "@/config/db/schema/admin.ts";
import { eq } from "drizzle-orm";
import assert from "assert";

const router = express.Router();

export default router.get(
  "/",
  checkAccess(),
  asyncHandler(async (req, res, next) => {
    assert(req.user);
    const userEmail = req.user.email;

    if (!userEmail) {
      return next(
        new HttpError(HttpCode.BAD_REQUEST, "User email not found")
      );
    }

    const studentRecord = await db
      .select()
      .from(phd)
      .where(eq(phd.email, userEmail))
      .limit(1);

    if (studentRecord.length === 0) {
      return next(
        new HttpError(HttpCode.NOT_FOUND, "Student record not found")
      );
    }

    const student = studentRecord[0];

    let status = "pending";
    
    const exam1Evaluated = student.qualifyingExam1 !== null;
    const exam2Evaluated = student.qualifyingExam2 !== null;
    
    if (exam1Evaluated || exam2Evaluated) {
      if (student.qualifyingExam1 === true || student.qualifyingExam2 === true) {
        status = "pass";
      } 
    
      else if (exam1Evaluated || exam2Evaluated  ){
        if(student.qualifyingExam1 === false || student.qualifyingExam2 === false) {
          status = "fail";
      }
    }
  }
    res.json({ success: true, status });
  })
);