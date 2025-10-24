import express from "express";
import db from "@/config/db/index.ts";
import { checkAccess } from "@/middleware/auth.ts";
import { asyncHandler } from "@/middleware/routeHandler.ts";
const router = express.Router();

router.get(
    "/",
    checkAccess(),
    asyncHandler(async (_req, res) => {
        const templates = await db.query.allocationFormTemplate.findMany({
            with: {
                createdBy: {
                    columns: {
                        name: true,
                        email: true,
                    },
                    with: {
                        faculty: { columns: { name: true } },
                        phd: { columns: { name: true } },
                        staff: { columns: { name: true } },
                    }
                },
            }
        });
        res.status(200).json(templates.map((template) => ({
            ...template,
            createdBy: {
                ...template.createdBy,
                name: template.createdBy.name ?? template.createdBy.faculty.name ?? template.createdBy.staff.name ?? template.createdBy.phd.name
            }
        })));
    })
);

export default router;
