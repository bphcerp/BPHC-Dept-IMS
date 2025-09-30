import express from "express";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import db from "@/config/db/index.ts";

const router = express.Router();

router.get(
    "/",
    asyncHandler(async (_req, res) => {
        const results = await db.query.users.findMany({
            where: (cols, { eq, or, and }) =>
                and(
                    or(eq(cols.type, "staff"), eq(cols.type, "faculty")),
                    eq(cols.deactivated, false)
                ),
            columns: { email: true, type: true },
            orderBy: (cols, { asc }) => asc(cols.name),
            with: {
                staff: {
                    columns: { name: true },
                },
                faculty: {
                    columns: { name: true },
                },
            },
        });

        res.status(200).json(
            results.map((user) => ({
                email: user.email,
                name:
                    user.type === "staff"
                        ? (user.staff?.name ?? null)
                        : (user.faculty?.name ?? null),
            }))
        );
    })
);

export default router;
