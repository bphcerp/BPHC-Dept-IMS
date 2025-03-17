import { checkAccess } from "@/middleware/auth.ts";
import express from "express";
import db from "@/config/db/index.ts";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import { phd } from "@/config/db/schema/admin.ts";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { HttpCode, HttpError } from "@/config/errors.ts";

const router = express.Router();

const examStatusSchema = z.object({
    email: z.string().email(),
    ifPass: z.boolean(),
});

router.post(
    "/",
    checkAccess(),
    asyncHandler(async (req, res, next) => {
        const parsed = examStatusSchema.parse(req.body);

        //checking if student exists
        const student = await db.query.phd.findFirst({
            where: eq(phd.email, parsed.email),
        });

        if (!student) {
            return next(
                new HttpError(HttpCode.NOT_FOUND, "User does not exist")
            );
        }

        //checkig if user has already given both exams
        if (
            student.qualifyingExam1 != null &&
            student.qualifyingExam2 != null
        ) {
            return next(
                new HttpError(
                    HttpCode.BAD_REQUEST,
                    "Student has already given both exams"
                )
            );
        }
        //updating exam status
        if (student.qualifyingExam1 == null) {
            await db
                .update(phd)
                .set({ qualifyingExam1: parsed.ifPass })
                .where(eq(phd.email, parsed.email));
        } else {
            await db
                .update(phd)
                .set({ qualifyingExam2: parsed.ifPass })
                .where(eq(phd.email, parsed.email));
        }

        res.status(200).json({ status: "success" });
    })
);

export default router;
