import type { CookieOptions } from "express";
import { PROD } from "@/config/environment.ts";

export const refreshTokenCookieOptions = (
    expiresAt: number
): CookieOptions => ({
    httpOnly: true,
    secure: PROD,
    expires: new Date(expiresAt),
    sameSite: "lax",
});
