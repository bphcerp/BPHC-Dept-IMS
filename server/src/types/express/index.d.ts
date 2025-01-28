import type { JwtPayload } from "@/types/auth.ts";
import type { RateLimitInfo } from "express-rate-limit";

declare global {
    namespace Express {
        export interface Request {
            user?: JwtPayload;
            rateLimit?: RateLimitInfo;
        }
    }
}
