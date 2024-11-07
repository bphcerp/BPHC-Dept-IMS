import requestIp from "request-ip";
import {
    rateLimit as expressRateLimit,
    type Options,
} from "express-rate-limit";
import { RedisStore } from "rate-limit-redis";
import redisClient from "@/lib/redis";
import logger from "@/lib/logger";

export const rateLimit = (options?: Partial<Options>, key = "") =>
    expressRateLimit({
        windowMs: 60 * 1000,
        limit: 20,
        standardHeaders: "draft-7",
        legacyHeaders: false,
        keyGenerator: (req) =>
            (requestIp.getClientIp(req) ?? "127.0.0.1") + key,
        store: new RedisStore({
            sendCommand: (...args: string[]) => redisClient.sendCommand(args),
            prefix: "ratelimit",
        }),
        handler: (req, res, _next, opts) => {
            void (async () => {
                logger.debug(
                    `RATELIMITED: ${await opts.keyGenerator(req, res)}`
                );
                res.status(429).send(opts.message);
            })();
        },
        ...options,
    });
