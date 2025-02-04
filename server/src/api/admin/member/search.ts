import express from "express";
import { z } from "zod";
import db from "@/config/db/index.ts";
import { asyncHandler } from "@/middleware/routeHandler.ts";

const router = express.Router();

const querySchema = z.object({
    q: z.string().trim().optional(),
});

router.get(
    "/",
    asyncHandler(async (req, res) => {
        const { q: searchQuery } = querySchema.parse(req.query);
        const faculty = (
            await db.query.faculty.findMany({
                columns: {
                    email: true,
                    name: true,
                },
                where: (fields, { or, ilike, sql }) =>
                    searchQuery?.length
                        ? or(
                              ilike(fields.email, `%${searchQuery}%`),
                              ilike(fields.name, `%${searchQuery}%`),
                              sql`lower(${searchQuery}) = ANY(users.roles)`
                          )
                        : undefined,
                with: {
                    user: {
                        columns: {
                            deactivated: true,
                            roles: true,
                        },
                    },
                },
            })
        ).map(({ user, ...f }) => ({
            ...f,
            type: "faculty",
            roles: user.roles,
        }));
        const phd = (
            await db.query.phd.findMany({
                columns: {
                    email: true,
                    name: true,
                },
                where: (fields, { or, ilike, sql }) =>
                    searchQuery?.length
                        ? or(
                              ilike(fields.email, `%${searchQuery}%`),
                              ilike(fields.name, `%${searchQuery}%`),
                              sql`lower(${searchQuery}) = ANY(users.roles)`
                          )
                        : undefined,
                with: {
                    user: {
                        columns: {
                            deactivated: true,
                            roles: true,
                        },
                    },
                },
            })
        ).map(({ user, ...p }) => ({
            ...p,
            type: "phd",
            roles: user.roles,
            deactivated: user.deactivated,
        }));
        const results = [...faculty, ...phd];
        res.status(200).json(results);
    })
);

export default router;
