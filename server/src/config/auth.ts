import type { CookieOptions } from "express";
import { PROD } from "@/config/environment";

export const refreshTokenCookieOptions = (
    expiresAt: number
): CookieOptions => ({
    httpOnly: true,
    secure: PROD,
    expires: new Date(expiresAt),
    sameSite: PROD ? "none" : undefined,
});
