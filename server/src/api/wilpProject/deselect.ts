import db from "@/config/db/index.ts";
import { wilpProject } from "@/config/db/schema/wilpProject.ts";
import { checkAccess } from "@/middleware/auth.ts";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import { and, eq } from "drizzle-orm";
import { Router } from "express";
import { wilpProjectSchemas } from "lib";

const router = Router();

router.patch(
    "/",
    checkAccess("wilp:project:deselect"),
    asyncHandler(async (req, res) => {
        const { idList } = wilpProjectSchemas.wilpProjectSelectBodySchema.parse(
            req.body
        );

        if (!req.user?.email) {
            res.status(401).json({ error: "Unauthorized" });
            return;
        }

        let result: {
            message: string;
            total: number;
            successful: number;
            failed: number;
            errors: string[];
        } = {
            message: "Project deselection completed",
            total: idList.length,
            successful: 0,
            failed: 0,
            errors: [],
        };

        for (const id of idList) {
            try {
                let updatedRow = await db
                    .update(wilpProject)
                    .set({
                        facultyEmail: null,
                    })
                    .where(
                        and(
                            eq(wilpProject.id, Number(id)),
                            eq(wilpProject.facultyEmail, req.user.email)
                        )
                    )
                    .returning();
                if (updatedRow.length === 0) {
                    throw new Error(
                        `Project is not selected or does not exist.`
                    );
                }
                result.successful++;
            } catch (error) {
                result.failed++;
                result.errors.push(
                    `Error deselecting project ${id}: ${error instanceof Error ? error.message : "Unknown error"}`
                );
            }
        }
        res.status(200).json(result);
    })
);

export default router;
