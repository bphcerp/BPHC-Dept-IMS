import db from "@/config/db/index.ts";
import { faculty } from "@/config/db/schema/admin.ts";
import { semester } from "@/config/db/schema/allocation.ts";
import environment from "@/config/environment.ts";
import { HttpCode, HttpError } from "@/config/errors.ts";
import { checkAccess } from "@/middleware/auth.ts";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import axios from "axios";
import { eq } from "drizzle-orm";
import express from "express";
import { semesterSchema } from "node_modules/lib/src/schemas/Allocation.ts";
import { TTDDepartment } from "node_modules/lib/src/types/allocation.ts";

const router = express.Router();

router.post(
    "/",
    checkAccess(),
    asyncHandler(async (req, res, next) => {
        const parsed = semesterSchema.parse(req.body);

        const { data: deptInfo } = await axios<TTDDepartment>(
            `${environment.TTD_API_URL}/${parsed.semesterType}/departments/${environment.TTD_DEPARTMENT_NAME}`
        );

        const hodAtStartOfSemEmail = (
            await db
                .select({ email: faculty.email })
                .from(faculty)
                .where(eq(faculty.psrn, deptInfo.hodPsrn))
        )[0]?.email;

        const dcaConvenerAtStartOfSemEmail = (
            await db
                .select({ email: faculty.email })
                .from(faculty)
                .where(eq(faculty.psrn, deptInfo.dcaConvener.psrn))
        )[0]?.email;

        try {
            const newSemester = await db
                .insert(semester)
                .values({
                    ...parsed,
                    hodAtStartOfSemEmail,
                    dcaConvenerAtStartOfSemEmail,
                })
                .returning();
            res.status(201).json(newSemester);
        } catch (error) {
            if ((error as any).code === "23505")
                return next(
                    new HttpError(
                        HttpCode.BAD_REQUEST,
                        "Semester already exists"
                    )
                );
            else throw error;
        }
    })
);

export default router;
