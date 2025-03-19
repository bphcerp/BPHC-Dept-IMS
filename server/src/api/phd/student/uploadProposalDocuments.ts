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
    checkAccess("phd-upload-proposal"),
    asyncHandler(async (req, res) => {
        assert(req.user);
        console.log(req.body);
        const parsed = phdSchemas.uploadProposalSchema.safeParse(req.body);
        if (!parsed.success) {
            res.status(400).json({ success: false, error: parsed.error.errors });
            return;
        }

        const { fileUrl1, fileUrl2, fileUrl3, formName1, formName2, formName3, supervisor, coSupervisor1, coSupervisor2 } = parsed.data;
        const email = req.user.email;
        const applicationType = "proposal";

        // Insert the three uploaded forms into phdDocuments
        await db.insert(phdDocuments).values([
            { email, fileUrl: fileUrl1, formName: formName1, applicationType, uploadedAt: new Date() },
            { email, fileUrl: fileUrl2, formName: formName2, applicationType, uploadedAt: new Date() },
            { email, fileUrl: fileUrl3, formName: formName3, applicationType, uploadedAt: new Date() },
        ]);

        // Update supervisor and co-supervisors in phd table
        await db
            .update(phd)
            .set({
                supervisorEmail: supervisor,
                coSupervisorEmail: coSupervisor1,
                coSupervisorEmail2: coSupervisor2,
            })
            .where(eq(phd.email, email));

        res.status(200).json({ success: true, message: "Proposal application uploaded successfully" });
    })
);
