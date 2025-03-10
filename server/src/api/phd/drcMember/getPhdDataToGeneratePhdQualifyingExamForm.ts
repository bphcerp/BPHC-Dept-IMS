import express from "express";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import { checkAccess } from "@/middleware/auth.ts";
import db from "@/config/db/index.ts";
import { phd } from "@/config/db/schema/admin.ts";
import { phdDocuments } from "@/config/db/schema/phd.ts";
import { eq, sql, desc } from "drizzle-orm";

const router = express.Router();

export default router.get(
    "/",
    checkAccess("drc-view-qualifying-exam-applications"),
    asyncHandler(async (_req, res) => {

        const documentEntries = await db
            .select({
                email: phdDocuments.email,
                fileUrl: phdDocuments.fileUrl,
                formName: phdDocuments.formName,
                uploadedAt: phdDocuments.uploadedAt,
            })
            .from(phdDocuments)
            .where(eq(phdDocuments.applicationType, "qualifying_exam"))
            .orderBy(desc(phdDocuments.uploadedAt));

        const documentMap = new Map<string, { [key: string]: string }>();
        for (const doc of documentEntries) {
            if (!documentMap.has(doc.email)) {
                documentMap.set(doc.email, {});
            }

            const studentDocs = documentMap.get(doc.email)!;
            if (Object.keys(studentDocs).length < 3) {
                studentDocs[doc.formName] = doc.fileUrl;
            }
        }

        const students = await db
            .select({
                name: phd.name,
                email: phd.email,
                idNumber: phd.idNumber,
                erpId: phd.erpId,
                qualifyingExam1: phd.qualifyingExam1,
                qualifyingExam2: phd.qualifyingExam2,
            })
            .from(phd)
            .where(sql`${phd.email} IN (${Array.from(documentMap.keys())})`);

        const applications = students.map((student) => ({
            ...student,
            files: documentMap.get(student.email) || {},
        }));

        if (applications.length === 0) {
             res.status(404).json({
                success: false,
                message: "No qualifying exam applications found",
            });
            return;
        }

        res.status(200).json({ success: true, applications });
    })
);
