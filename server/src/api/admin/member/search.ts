import express from "express";
import { z } from "zod";
import db from "@/config/db";
import { asyncHandler } from "@/middleware/routeHandler";
import { HttpCode, HttpError } from "@/config/errors";
import { users } from "@/config/db/schema/admin";
import { ilike, or, sql } from "drizzle-orm";

const router = express.Router();

const querySchema = z.object({
    q: z.string().trim().optional(),
});

router.get(
    "/",
    asyncHandler(async (req, res, next) => {
        const { q: searchQuery } = querySchema.parse(req.query);
        const results = await db
            .select()
            .from(users)
            .where(
                searchQuery?.length
                    ? or(
                          ilike(users.email, `%${searchQuery}%`),
                          ilike(users.name, `%${searchQuery}%`),
                          sql`lower(${searchQuery}) = ANY(users.roles)`
                      )
                    : undefined
            );
        res.status(200).json(results);
    })
);

export default router;
