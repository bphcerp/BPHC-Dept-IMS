import { GOOGLE_CLIENT_ID, REFRESH_TOKEN_COOKIE } from "@/config/environment";
import { AppError, HttpCode } from "@/config/errors";
import express from "express";
import { type LoginTicket, OAuth2Client } from "google-auth-library";
import { z } from "zod";
import { fromError } from "zod-validation-error";
import db from "@/lib/db";
import { users } from "@/lib/db/schema/users";
import { eq } from "drizzle-orm";
import {
    generateAccessToken,
    generateRefreshToken,
    getAccess,
} from "@/lib/auth";
import { refreshTokenCookieOptions } from "@/config/auth";
import assert from "assert";
import { asyncHandler } from "@/middleware/errorhandler";

const client = new OAuth2Client(GOOGLE_CLIENT_ID);
const router = express.Router();

const bodySchema = z.object({
    token: z.string(),
});

router.post(
    "/",
    asyncHandler(async (req, res, next) => {
        const parseResult = bodySchema.safeParse(req.body);
        if (!parseResult.success) {
            next(
                new AppError({
                    httpCode: HttpCode.BAD_REQUEST,
                    description: "token not found in body",
                    feedback: fromError(parseResult.error).toString(),
                })
            );
            return;
        }
        let ticket: LoginTicket;
        try {
            ticket = await client.verifyIdToken({
                idToken: parseResult.data.token,
                audience: GOOGLE_CLIENT_ID,
            });
        } catch {
            return next(
                new AppError({
                    httpCode: HttpCode.UNAUTHORIZED,
                    description: "Invalid token",
                })
            );
        }
        const ticketPayload = ticket.getPayload()!;
        if (!ticketPayload.email)
            return next(
                new AppError({
                    httpCode: HttpCode.BAD_REQUEST,
                    description: "Login failed",
                    feedback: "Invalid scope - email was not provided",
                })
            );
        await db.transaction(async (tx) => {
            assert(ticketPayload.email);

            const user = await db.query.users.findFirst({
                where: eq(users.email, ticketPayload.email),
            });

            if (!user)
                return next(
                    new AppError({
                        httpCode: HttpCode.FORBIDDEN,
                        description: "User not in database",
                    })
                );

            const { refreshToken, sessionExpiry } = await generateRefreshToken(
                ticketPayload.email,
                tx
            );
            const accessToken = generateAccessToken(
                ticketPayload.sub,
                sessionExpiry,
                await getAccess(user.role ? [user.role] : [])
            );

            res.status(200);
            res.cookie(
                REFRESH_TOKEN_COOKIE,
                refreshToken,
                refreshTokenCookieOptions(sessionExpiry * 1000)
            );
            res.json({ token: accessToken });
        });
    })
);

export default router;
