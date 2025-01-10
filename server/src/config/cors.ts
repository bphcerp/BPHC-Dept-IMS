import { PROD } from "@/config/environment";
import logger from "@/config/logger";
import type { CorsOptions } from "cors";
import { AppError, HttpCode } from "./errors";

const allowedOrigins: string[] = [];

if (!PROD)
    allowedOrigins.push("http://localhost:5173", "http://localhost:9000");

const corsOptions: CorsOptions = {
    origin: (origin, callback) => {
        const err = new AppError({
            httpCode: HttpCode.FORBIDDEN,
            description:
                "The CORS policy for this site does not " +
                "allow access from the specified origin.",
        });
        if (!origin) return callback(null, true);
        if (!allowedOrigins.includes(origin)) {
            logger.info("CORS policy not allowed for origin: " + origin);
            return callback(err, false);
        }
        return callback(null, true);
    },
    credentials: true,
};

export default corsOptions;
