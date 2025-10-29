import { HttpCode } from "@/config/errors.ts";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import express from "express";
import {Redis} from "ioredis";
import fetch from "node-fetch";
import environment from "@/config/environment.ts";
const router = express.Router();

const redisConfig = {
    host: environment.REDIS_HOST,
    port: environment.REDIS_PORT,
    password: environment.REDIS_PASSWORD,
};

const redis = new Redis(redisConfig);

const GITHUB_OWNER = "bphcerp";
const GITHUB_REPO = "BPHC-Dept-IMS";
const CACHE_KEY = "github:contributors";
const CACHE_TTL = 60 * 60;

router.get(
    "/",
    asyncHandler(async (_req, res) => {
        const cached = await redis.get(CACHE_KEY);
        if (cached) {
            res.status(HttpCode.OK).json(JSON.parse(cached));
            return;
        }
        const githubRes = await fetch(
            `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contributors`
        );
        if (!githubRes.ok) {
            res.status(502).json({ error: "Failed to fetch contributors" });
            return;
        }
        const contributors: unknown = await githubRes.json();
        await redis.set(CACHE_KEY, JSON.stringify(contributors), "EX", CACHE_TTL);
        res.status(HttpCode.OK).json(contributors);
    })
);

export default router;
