import env from "@/config/environment";
import { HttpError, HttpCode } from "@/config/errors";
import express from "express";
import { type LoginTicket, OAuth2Client } from "google-auth-library";
import { z } from "zod";
import { fromError } from "zod-validation-error";
import db from "@/config/db";
import { users } from "@/config/db/schema/admin";
import { eq } from "drizzle-orm";
import {
    generateAccessToken,
    generateRefreshToken,
    getAccess,
} from "@/lib/auth";
import { refreshTokenCookieOptions } from "@/config/auth";
import assert from "assert";
import { asyncHandler } from "@/middleware/routeHandler";

const client = new OAuth2Client(env.GOOGLE_CLIENT_ID);
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
                new HttpError(
                    HttpCode.BAD_REQUEST,
                    "token not found in body",
                    fromError(parseResult.error).toString()
                )
            );
            return;
        }
        let ticket: LoginTicket;
        try {
            ticket = await client.verifyIdToken({
                idToken: parseResult.data.token,
                audience: env.GOOGLE_CLIENT_ID,
            });
        } catch {
            return next(new HttpError(HttpCode.UNAUTHORIZED, "Invalid token"));
        }
        const ticketPayload = ticket.getPayload()!;
        if (!ticketPayload.email)
            return next(
                new HttpError(
                    HttpCode.BAD_REQUEST,
                    "Login failed",
                    "Invalid scope - email was not provided"
                )
            );
        await db.transaction(async (tx) => {
            assert(ticketPayload.email);

            const user = await db.query.users.findFirst({
                where: eq(users.email, ticketPayload.email),
            });

            if (!user)
                return next(
                    new HttpError(HttpCode.FORBIDDEN, "User not in database")
                );

            const { refreshToken, sessionExpiry } = await generateRefreshToken(
                ticketPayload.email,
                tx
            );
            const accessToken = generateAccessToken(
                ticketPayload.email,
                sessionExpiry,
                await getAccess(user.roles)
            );

            res.status(200);
            res.cookie(
                env.REFRESH_TOKEN_COOKIE,
                refreshToken,
                refreshTokenCookieOptions(sessionExpiry * 1000)
            );
            res.json({ token: accessToken });
        });
    })
);

export default router;
