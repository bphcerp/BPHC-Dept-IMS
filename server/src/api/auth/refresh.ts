import env from "@/config/environment";
import { HttpError, HttpCode } from "@/config/errors";
import express from "express";
import { asyncHandler } from "@/middleware/routeHandler";
import { z } from "zod";
import db from "@/config/db";
import { eq } from "drizzle-orm";
import {
    generateAccessToken,
    generateRefreshToken,
    getAccess,
} from "@/lib/auth";
import { refreshTokenCookieOptions } from "@/config/auth";
import { refreshTokens } from "@/config/db/schema/admin";
import jwt, { type VerifyErrors } from "jsonwebtoken";

const router = express.Router();

router.post(
    "/",
    asyncHandler(async (req, res, next) => {
        await db.transaction(
            async (tx) => {
                const cookies = req.cookies as Record<string, string>;
                const refreshToken = cookies
                    ? cookies[env.REFRESH_TOKEN_COOKIE]
                    : undefined;
                if (!refreshToken)
                    return next(
                        new HttpError(
                            HttpCode.UNAUTHORIZED,
                            "Refresh token not found"
                        )
                    );
                let decoded: string | jwt.JwtPayload;
                try {
                    decoded = jwt.verify(
                        refreshToken,
                        env.REFRESH_TOKEN_SECRET
                    );
                } catch (e) {
                    const err = e as VerifyErrors;
                    return next(
                        new HttpError(
                            HttpCode.UNAUTHORIZED,
                            err
                                ? err.name === "TokenExpiredError"
                                    ? "Refresh token expired"
                                    : "Invalid refresh token"
                                : "Unknown Error"
                        )
                    );
                }
                const jwtPayloadSchema = z.object({
                    email: z.string(),
                });
                const parsed = jwtPayloadSchema.safeParse(decoded);
                if (!parsed.success) {
                    res.clearCookie(env.REFRESH_TOKEN_COOKIE);
                    return next(
                        new HttpError(
                            HttpCode.INTERNAL_SERVER_ERROR,
                            "An error occurred",
                            "Invalid refresh token payload"
                        )
                    );
                }
                const storedTokenData = await tx.query.refreshTokens.findFirst({
                    where: eq(refreshTokens.token, refreshToken),
                    with: {
                        user: true,
                    },
                });
                if (!storedTokenData) {
                    res.clearCookie(env.REFRESH_TOKEN_COOKIE);
                    return next(
                        new HttpError(
                            HttpCode.UNAUTHORIZED,
                            "Invalid refresh token"
                        )
                    );
                }
                const { refreshToken: newRefreshToken, sessionExpiry } =
                    await generateRefreshToken(
                        parsed.data.email,
                        tx,
                        storedTokenData.id
                    );

                const accessToken = generateAccessToken(
                    parsed.data.email,
                    storedTokenData.user.name,
                    sessionExpiry,
                    await getAccess(storedTokenData.user.roles)
                );
                res.cookie(
                    env.REFRESH_TOKEN_COOKIE,
                    newRefreshToken,
                    refreshTokenCookieOptions(sessionExpiry * 1000)
                );
                return res.status(200).json({ token: accessToken });
            },
            { isolationLevel: "serializable" }
        );
    })
);

export default router;
