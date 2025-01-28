import express from "express";
import { z } from "zod";
import db from "@/config/db";
import { asyncHandler } from "@/middleware/routeHandler";
import { HttpCode, HttpError } from "@/config/errors";
import { users } from "@/config/db/schema/admin";
import { ilike, or, sql } from "drizzle-orm";

const router = express.Router();

const searchSchema = z.object({
    searchQuery: z.string().trim().nonempty(),
});

router.post(
    "/",
    asyncHandler(async (req, res, next) => {
        const parseResults = searchSchema.safeParse(req.body);
        try {
            const results = await db
                .select()
                .from(users)
                .where(
                    or(
                        ilike(
                            users.email,
                            `%${parseResults.data?.searchQuery}%`
                        ),
                        sql`lower(${parseResults.data?.searchQuery}) = ANY(users.roles)`
                    )
                );
            res.status(200).json({ success: true, searchResults: results });
        } catch (err) {
            throw new HttpError(
                HttpCode.INTERNAL_SERVER_ERROR,
                "Error while searching for members",
                (err as Error)?.message
            );
        }
    })
);

export default router;
