import redis from "redis";
import logger from "./logger";
import { REDIS_URL } from "@/config/environment";

export const REDIS_TTL = {
    ROLES: 30,
};

export const REDIS_KEYS = {
    lastSessionInvalidation: (userId: string) =>
        `lastSessionInvalidation:${userId}`,
};

const redisClient = redis.createClient({
    url: REDIS_URL,
});

void redisClient.connect().catch(() => null);

redisClient.on("connect", () => {
    logger.info("Connected to Redis");
});

redisClient.on("error", (error) => {
    logger.error(`Redis error: ${error}`);
});

redisClient.on("end", () => {
    logger.info("Disconnected from Redis");
});

export default redisClient;
