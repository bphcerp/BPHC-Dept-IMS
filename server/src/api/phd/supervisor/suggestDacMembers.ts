import express from "express";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import { checkAccess } from "@/middleware/auth.ts";
import db from "@/config/db/index.ts";
import { phd } from "@/config/db/schema/admin.ts";
import { and, eq } from "drizzle-orm";
import assert from "assert";
import { phdSchemas } from "lib";
import { HttpError, HttpCode } from "@/config/errors.ts";

const router = express.Router();

export default router.post(
    "/",
    checkAccess(),
    asyncHandler(async (req, res) => {
        assert(req.user);
        
        // Log full request body for debugging
        console.log('Full Request Body:', req.body);
        
        // Parse the request body
        const parsed = phdSchemas.suggestDacMembersSchema.parse({
            dacMembers: req.body.dacMembers,
            studentEmail: req.body.studentEmail
        });
        
        const { dacMembers, studentEmail } = parsed;
        const supervisorEmail = req.user.email;

        console.log('Supervisor Email:', supervisorEmail);
        console.log('Student Email:', studentEmail);
        console.log('DAC Members:', dacMembers);

        // Additional check to ensure studentEmail is not empty
        if (!studentEmail) {
            throw new HttpError(
                HttpCode.BAD_REQUEST, 
                "Student email is required"
            );
        }

        // Verify the student is under this supervisor's supervision
        // const student = await db
        //     .select({ email: phd.email })
        //     .from(phd)
        //     .where(and(
        //         eq(phd.supervisorEmail, supervisorEmail),
        //         eq(phd.email, studentEmail)
        //     ))
        //     .limit(1);

        // if (student.length === 0) {
        //     throw new HttpError(
        //         HttpCode.FORBIDDEN, 
        //         "You are not authorized to suggest DAC members for this student"
        //     );
        // }

        // Update the student's record with suggested DAC members
        const updateResult = await db
            .update(phd)
            .set({ 
                suggestedDacMembers: dacMembers, 
            }) 
            .where(eq(phd.email, studentEmail));

        console.log('Update Result:', updateResult);

        res.status(200).json({ 
            success: true, 
            message: "DAC members suggested successfully" 
        });
    })
);