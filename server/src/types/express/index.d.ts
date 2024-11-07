import type { Role } from "@/lib/db/schema/roles";
import type { JwtPayload } from "@/types/auth";
import type { RateLimitInfo } from "express-rate-limit";

declare global {
    namespace Express {
        export interface Request {
            user?: JwtPayload;
            roles?: Role[];
            rateLimit?: RateLimitInfo;
        }
    }
}
