import environment from "@/config/environment.ts";

export const redisConfig = {
    host: environment.REDIS_HOST,
    port: environment.REDIS_PORT,
    password: environment.REDIS_PASSWORD,
    maxRetriesPerRequest: null,
    enableReadyCheck: true,
};
