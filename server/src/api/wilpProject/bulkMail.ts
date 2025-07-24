import db from "@/config/db/index.ts";
import { faculty } from "@/config/db/schema/admin.ts";
import { sendBulkEmails } from "@/lib/common/email.ts";
import { checkAccess } from "@/middleware/auth.ts";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import express, { Request, Response } from "express";
import { wilpProjectBulkMailSchema } from "node_modules/lib/src/schemas/WilpProject.ts";

const router = express.Router();

router.post(
    "/bulk",
    checkAccess("wilp:project:mail"),
    asyncHandler(async (req: Request, res: Response) => {
        let { subject, text, includeFaculty, additionalMailList } =
            wilpProjectBulkMailSchema.parse(req.body);
        subject = subject.trim();
        text = text.trim();

        if (
            !includeFaculty &&
            (!additionalMailList || additionalMailList.length === 0)
        ) {
            res.status(400).json({
                success: false,
                message: "No recipients selected",
            });
            return;
        }

        const emails: Parameters<typeof sendBulkEmails>[0] = [];
        if (includeFaculty) {
            let facultyEmails = await db
                .select({
                    email: faculty.email,
                })
                .from(faculty);
            console.log(facultyEmails);
            for (let i = 0; i < facultyEmails.length; i++) {
                emails.push({
                    to: facultyEmails[i].email,
                    subject,
                    text,
                });
            }
        }

        if (additionalMailList && additionalMailList.length > 0) {
            for (const email of additionalMailList) {
                emails.push({
                    to: email.trim(),
                    subject,
                    text,
                });
            }
        }

        await sendBulkEmails(emails);
        res.status(200).json({ success: true });
    })
);

export default router;
