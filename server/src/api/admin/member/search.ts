import express from "express";
import { z } from "zod";
import db from "@/config/db";
import { asyncHandler } from "@/middleware/routeHandler";
import { users } from "@/config/db/schema/admin";
import { ilike, or, sql } from "drizzle-orm";

const router = express.Router();

const searchSchema = z.object({
    searchQuery: z.string().trim().nonempty(),
});

router.post(
    "/",
    asyncHandler(async (req, res, next) => {
        const { searchQuery } = searchSchema.parse(req.body);
        const results = await db
            .select()
            .from(users)
            .where(
                or(
                    ilike(users.email, `%${searchQuery}%`),
                    sql`lower(${searchQuery}) = ANY(users.roles)`
                )
            );
        res.status(200).json({ success: true, searchResults: results });
    })
);

export default router;
