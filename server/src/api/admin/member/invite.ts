import express from "express";
import db from "@/config/db/index.ts";
import { faculty, phd, staff, users } from "@/config/db/schema/admin.ts";
import { HttpError, HttpCode } from "@/config/errors.ts";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import env from "@/config/environment.ts";
import { checkAccess } from "@/middleware/auth.ts";
import { adminSchemas } from "lib";
import environment from "@/config/environment.ts";
import { sendEmail } from "@/lib/common/email.ts";

const router = express.Router();

router.post(
    "/",
    checkAccess(),
    asyncHandler(async (req, res, next) => {
        const parsed = adminSchemas.inviteMemberBodySchema.parse(req.body);
        try {
            await db.transaction(async (db) => {
                // Insert the user into the database
                const insertedUser = await db
                    .insert(users)
                    .values({
                        email: parsed.email,
                        type: parsed.type,
                        roles: [], // Default to an empty array for roles
                    })
                    .onConflictDoNothing()
                    .returning();
                if (insertedUser.length === 0) {
                    throw new HttpError(
                        HttpCode.CONFLICT,
                        "User already exists"
                    );
                }
                // Insert user details
                const insertedDetails = await db
                    .insert(
                        parsed.type === adminSchemas.userTypes[0]
                            ? faculty
                            : parsed.type === adminSchemas.userTypes[1]
                              ? phd
                              : staff
                    )
                    .values({
                        email: insertedUser[0].email,
                    })
                    .onConflictDoNothing()
                    .returning();

                if (insertedDetails.length === 0) {
                    throw new HttpError(
                        HttpCode.CONFLICT,
                        "User details already exist"
                    );
                }
                if (parsed.sendEmail && env.PROD) {
                    await sendEmail({
                        to: parsed.email,
                        subject: "Member invitation",
                        text: `Hello! You are invited to access the ${environment.DEPARTMENT_NAME} IMS portal. Website link: ${env.FRONTEND_URL}`,
                    });
                }
                return res.status(200).json({ success: true });
            });
        } catch (e) {
            if (e instanceof HttpError) {
                return next(e);
            } else {
                throw e;
            }
        }
    })
);

export default router;
