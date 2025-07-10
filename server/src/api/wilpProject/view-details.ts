import { Request, Response } from "express";
import db from "@/config/db/index.ts";
import { checkAccess } from "@/middleware/auth.ts";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import express from "express";
import { eq } from "drizzle-orm";
import { wilpProject } from "@/config/db/schema/wilpProject.ts";
import { faculty } from "@/config/db/schema/admin.ts";
import { wilpProjectSchemas } from "lib";

const router = express.Router();

router.get(
    "/",
    checkAccess("wilp:project:view-details"),
    asyncHandler(async (req: Request, res: Response) => {
        const { id } =
            wilpProjectSchemas.wilpProjectViewDetailsQuerySchema.parse(
                req.query
            );

        const data = await db
            .select({
                id: wilpProject.id,
                studentId: wilpProject.studentId,
                discipline: wilpProject.discipline,
                studentName: wilpProject.studentName,
                organization: wilpProject.organization,
                degreeProgram: wilpProject.degreeProgram,
                researchArea: wilpProject.researchArea,
                dissertationTitle: wilpProject.dissertationTitle,
                reminder: wilpProject.reminder,
                deadline: wilpProject.deadline,
                createdAt: wilpProject.createdAt,
                updatedAt: wilpProject.updatedAt,
                facultyPsrn: faculty.psrn,
                facultyName: faculty.name,
                facultyEmail: wilpProject.facultyEmail,
                facultyDepartment: faculty.department,
                facultyDesignation: faculty.designation,
                facultyPhone: faculty.phone,
            })
            .from(wilpProject)
            .leftJoin(faculty, eq(wilpProject.facultyEmail, faculty.email))
            .where(eq(wilpProject.id, Number(id)))
            .limit(1);
        if (!data || !data.length) {
            res.status(404).json({ error: "Project not found" });
            return;
        }

        const result = {
            id: data[0].id,
            studentId: data[0].studentId,
            discipline: data[0].discipline,
            studentName: data[0].studentName,
            organization: data[0].organization,
            degreeProgram: data[0].degreeProgram,
            researchArea: data[0].researchArea,
            dissertationTitle: data[0].dissertationTitle,
            facultyEmail: data[0].facultyEmail,
            reminder: data[0].reminder,
            deadline: data[0].deadline,
            createdAt: data[0].createdAt,
            updatedAt: data[0].updatedAt,
            faculty: data[0].facultyEmail
                ? {
                      psrn: data[0].facultyPsrn,
                      name: data[0].facultyName,
                      email: data[0].facultyEmail,
                      department: data[0].facultyDepartment,
                      designation: data[0].facultyDesignation,
                      phone: data[0].facultyPhone,
                  }
                : null,
        };

        res.json(result);
    })
);

export default router;
