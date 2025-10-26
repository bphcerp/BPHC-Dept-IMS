import { Router } from "express";
import { checkAccess } from "@/middleware/auth.ts";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import db from "@/config/db/index.ts";
import { faculty } from "@/config/db/schema/admin.ts";
import { ilike, or } from "drizzle-orm";

const router = Router();

router.get(
    "/",
    checkAccess("grades:view"),
    asyncHandler(async (req, res) => {
        const search = req.query.search as string;
        const limit = parseInt(req.query.limit as string) || 50;

        let facultyQuery = db.query.faculty.findMany({
            columns: {
                email: true,
                name: true,
                department: true,
            },
            limit,
        });

        if (search?.trim()) {
            const searchTerm = `%${search.trim()}%`;
            facultyQuery = db.query.faculty.findMany({
                columns: {
                    email: true,
                    name: true,
                    department: true,
                },
                where: or(
                    ilike(faculty.name, searchTerm),
                    ilike(faculty.email, searchTerm),
                    ilike(faculty.department, searchTerm)
                ),
                limit,
            });
        }

        const facultyList = await facultyQuery;

        res.json({
            success: true,
            data: facultyList.map(f => ({
                email: f.email,
                name: f.name,
                department: f.department,
                displayName: f.name ? `${f.name} (${f.email})` : f.email,
            })),
        });
    })
);

export default router;
