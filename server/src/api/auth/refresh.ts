import {
    REFRESH_TOKEN_COOKIE,
    REFRESH_TOKEN_SECRET,
} from "@/config/environment";
import { AppError, HttpCode } from "@/config/errors";
import express from "express";
import { asyncHandler } from "@/middleware/errorhandler";
import { z } from "zod";
import db from "@/config/db";
import { eq } from "drizzle-orm";
import {
    generateAccessToken,
    generateRefreshToken,
    getAccess,
} from "@/lib/auth";
import { refreshTokenCookieOptions } from "@/config/auth";
import { refreshTokens } from "@/config/db/schema/users";
import jwt, { type VerifyErrors } from "jsonwebtoken";

const router = express.Router();

router.post(
    "/",
    asyncHandler(async (req, res, next) => {
        await db.transaction(
            async (tx) => {
                const cookies = req.cookies as Record<string, string>;
                const refreshToken = cookies
                    ? cookies[REFRESH_TOKEN_COOKIE]
                    : undefined;
                if (!refreshToken)
                    return next(
                        new AppError({
                            httpCode: HttpCode.UNAUTHORIZED,
                            description: "Refresh token not found",
                        })
                    );
                let decoded: string | jwt.JwtPayload;
                try {
                    decoded = jwt.verify(refreshToken, REFRESH_TOKEN_SECRET);
                } catch (e) {
                    const err = e as VerifyErrors;
                    return next(
                        new AppError({
                            httpCode: HttpCode.UNAUTHORIZED,
                            description: err
                                ? err.name === "TokenExpiredError"
                                    ? "Refresh token expired"
                                    : "Invalid refresh token"
                                : "Unknown Error",
                        })
                    );
                }
                const jwtPayloadSchema = z.object({
                    email: z.string(),
                });
                const parsed = jwtPayloadSchema.safeParse(decoded);
                if (!parsed.success) {
                    res.clearCookie(REFRESH_TOKEN_COOKIE);
                    return next(
                        new AppError({
                            httpCode: HttpCode.INTERNAL_SERVER_ERROR,
                            description: "An error occurred",
                            feedback: "Invalid refresh token payload",
                        })
                    );
                }
                const storedTokenData = await tx.query.refreshTokens.findFirst({
                    where: eq(refreshTokens.token, refreshToken),
                    with: {
                        user: true,
                    },
                });
                if (!storedTokenData) {
                    res.clearCookie(REFRESH_TOKEN_COOKIE);
                    return next(
                        new AppError({
                            httpCode: HttpCode.UNAUTHORIZED,
                            description: "Invalid refresh token",
                        })
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
                    sessionExpiry,
                    await getAccess(
                        storedTokenData.user.role
                            ? [storedTokenData.user.role]
                            : []
                    )
                );
                res.cookie(
                    REFRESH_TOKEN_COOKIE,
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
