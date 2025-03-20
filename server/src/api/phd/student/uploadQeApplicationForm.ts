import express from "express";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import { checkAccess } from "@/middleware/auth.ts";
import db from "@/config/db/index.ts";
import { phd } from "@/config/db/schema/admin.ts";
import { phdDocuments } from "@/config/db/schema/phd.ts";
import { eq } from "drizzle-orm";
import assert from "assert";
import { phdSchemas } from "lib";

const router = express.Router();

export default router.post(
    "/",
    checkAccess("phd-upload-application"),
    asyncHandler(async (req, res) => {
        assert(req.user);
        const parsed = phdSchemas.uploadApplicationSchema.safeParse(req.body);
        if (!parsed.success) {
            res.status(400).json({
                success: false,
                error: parsed.error.errors,
            });
            return;
        }

        const {
            fileUrl,
            formName,
            applicationType,
            qualifyingArea1,
            qualifyingArea2,
        } = parsed.data;
        const email = req.user.email;

        await db.insert(phdDocuments).values({
            email,
            fileUrl,
            formName,
            applicationType,
            uploadedAt: new Date(),
        });

        const student = await db.query.phd.findFirst({
            where: eq(phd.email, email),
        });

        if (!student) {
            res.status(404).json({
                success: false,
                message: "Student not found",
            });
            return;
        }

        const currentApplications = student.numberOfQeApplication ?? 0;

        await db
            .update(phd)
            .set({
                qualifyingArea1,
                qualifyingArea2,
                numberOfQeApplication: currentApplications + 1,
                qualifyingAreasUpdatedAt: new Date(),
            })
            .where(eq(phd.email, email));

        res.status(200).json({
            success: true,
            message: "Application uploaded successfully",
        });
    })
);
