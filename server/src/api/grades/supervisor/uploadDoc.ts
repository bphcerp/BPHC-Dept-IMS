import { Router } from "express";
import db from "@/config/db/index.ts";
import { instructorSupervisorGrades } from "@/config/db/schema/phd.ts";
import { checkAccess } from "@/middleware/auth.ts";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import { HttpCode, HttpError } from "@/config/errors.ts";
import { pdfUpload } from "@/config/multer.ts";
import { files } from "@/config/db/schema/form.ts";
import { modules } from "lib";
import { and, eq } from "drizzle-orm";

const router = Router();

router.post(
    "/",
    checkAccess("grades:supervisor:upload-doc"),
    pdfUpload.single("file"),
    asyncHandler(async (req, res, next) => {
        const supervisorEmail = req.user?.email;
        if (!supervisorEmail) {
            return next(new HttpError(HttpCode.UNAUTHORIZED, "Unauthenticated"));
        }
        const { studentErpId, courseName, type, erpId, name } = req.body as { studentErpId?: string; courseName?: string; type?: string; erpId?: string; name?: string };
        if (!studentErpId || !courseName || !type) {
            return next(new HttpError(HttpCode.BAD_REQUEST, "Missing studentErpId/courseName/type"));
        }
        if (!req.file) {
            return next(new HttpError(HttpCode.BAD_REQUEST, "Missing file"));
        }

        const existing = await db.query.instructorSupervisorGrades.findFirst({
            where: (t) => and(
                eq(t.studentErpId, studentErpId),
                eq(t.courseName, courseName),
                eq(t.instructorSupervisorEmail, supervisorEmail)
            ),
        });

        if (!existing) {
            return next(new HttpError(HttpCode.FORBIDDEN, "Not allowed for this student/course"));
        }

        const inserted = await db.insert(files).values({
            userEmail: supervisorEmail,
            filePath: req.file.path,
            originalName: erpId && name ? `${erpId}_${name}.pdf` : req.file.originalname,
            mimetype: req.file.mimetype,
            size: req.file.size,
            fieldName: type === 'mid' ? 'midsemReport' : 'endsemReport',
            module: modules[5],
        }).returning();
        const fileId = inserted[0].id;

        await db
            .update(instructorSupervisorGrades)
            .set(type === 'mid' ? { midsemDocFileId: fileId } : { endsemDocFileId: fileId })
            .where(eq(instructorSupervisorGrades.id, existing.id));

        res.json({ success: true, fileId });
    })
);

export default router;


