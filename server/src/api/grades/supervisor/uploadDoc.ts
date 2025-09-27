import { Router } from "express";
import db from "@/config/db/index.ts";
import { phdSupervisorGrades } from "@/config/db/schema/phd.ts";
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
        const { studentEmail, courseName, type, erpId, name } = req.body as { studentEmail?: string; courseName?: string; type?: string; erpId?: string; name?: string };
        if (!studentEmail || !courseName || !type) {
            return next(new HttpError(HttpCode.BAD_REQUEST, "Missing studentEmail/courseName/type"));
        }
        if (!req.file) {
            return next(new HttpError(HttpCode.BAD_REQUEST, "Missing file"));
        }

        const student = await db.query.phd.findFirst({
            where: (phd) => and(eq(phd.email, studentEmail), eq(phd.supervisorEmail, supervisorEmail)),
            columns: { email: true },
        });
        if (!student) {
            return next(new HttpError(HttpCode.FORBIDDEN, "Not allowed for this student"));
        }

        const existing = await db.query.phdSupervisorGrades.findFirst({
            where: (t) => and(eq(t.studentEmail, studentEmail), eq(t.courseName, courseName)),
        });

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

        if (existing) {
            await db
                .update(phdSupervisorGrades)
                .set(type === 'mid' ? { midsemDocFileId: fileId } : { endsemDocFileId: fileId })
                .where(eq(phdSupervisorGrades.id, existing.id));
        } else {
            await db.insert(phdSupervisorGrades).values({
                studentEmail,
                supervisorEmail,
                courseName,
                ...(type === 'mid' ? { midsemDocFileId: fileId } : { endsemDocFileId: fileId }),
            });
        }

        res.json({ success: true, fileId });
    })
);

export default router;


