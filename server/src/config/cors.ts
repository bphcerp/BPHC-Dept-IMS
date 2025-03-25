import { PROD } from "@/config/environment.ts";
import logger from "@/config/logger.ts";
import type { CorsOptions } from "cors";
import { HttpCode, HttpError } from "./errors.ts";

const allowedOrigins: string[] = ["https://eee.ims.bits-hyderabad.ac.in"];

if (!PROD)
    allowedOrigins.push("http://localhost:5173", "http://localhost:9000");

const corsOptions: CorsOptions = {
    origin: (origin, callback) => {
        const err = new HttpError(
            HttpCode.FORBIDDEN,
            "The CORS policy for this site does not " +
                "allow access from the specified origin."
        );
        if (!origin) return callback(null, true);
        if (!allowedOrigins.includes(origin)) {
            logger.warn("CORS policy not allowed for origin: " + origin);
            return callback(err, false);
        }
        return callback(null, true);
    },
    credentials: true,
};

export default corsOptions;
