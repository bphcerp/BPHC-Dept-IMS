import db from "@/config/db/index.ts";
import {
    wilpProject,
    wilpProjectsRange,
} from "@/config/db/schema/wilpProject.ts";
import { checkAccess } from "@/middleware/auth.ts";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import { and, count, desc, eq, isNull } from "drizzle-orm";
import { Router } from "express";
import { wilpProjectSchemas } from "lib";

const router = Router();

router.patch(
    "/",
    checkAccess("wilp:project:select"),
    asyncHandler(async (req, res) => {
        const { idList } = wilpProjectSchemas.wilpProjectSelectBodySchema.parse(
            req.body
        );

        let selectRange = await db
            .select()
            .from(wilpProjectsRange)
            .orderBy(desc(wilpProjectsRange.createdAt))
            .limit(1);
        if (selectRange.length === 0) {
            res.status(500).json({
                error: "No project selection range found. Please contact admin.",
            });
            return;
        }

        if (!req.user?.email) {
            res.status(401).json({ error: "Unauthorized" });
            return;
        }

        // check how many projects are selected already
        let selected = await db
            .select({
                count: count(wilpProject.id),
            })
            .from(wilpProject)
            .where(eq(wilpProject.facultyEmail, req.user.email));

        // makes sure total selected projects are within the range
        // even if there are already selected projects
        const newSelectedCount = selected[0].count + idList.length;
        const minSelect = selectRange[0].min - selected[0].count;
        const maxSelect = selectRange[0].max - selected[0].count;
        if (newSelectedCount < selectRange[0].min) {
            res.status(400).json({
                error: `Please select ${minSelect}${
                    minSelect !== maxSelect ? ` to ${maxSelect}` : ""
                } projects.`,
            });
            return;
        }
        if (newSelectedCount > selectRange[0].max) {
            res.status(400).json({
                error: `${selected[0].count} projects selected. Maximum allowed: ${selectRange[0].max}`,
            });
            return;
        }

        let result: {
            message: string;
            total: number;
            successful: number;
            failed: number;
            errors: string[];
        } = {
            message: "Project selection completed",
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
                        facultyEmail: req.user.email,
                    })
                    .where(
                        and(
                            eq(wilpProject.id, Number(id)),
                            isNull(wilpProject.facultyEmail)
                        )
                    )
                    .returning();
                if (updatedRow.length === 0) {
                    throw new Error(
                        "Project already selected or does not exist."
                    );
                }
                result.successful++;
            } catch (error) {
                result.failed++;
                result.errors.push(
                    `Error selecting project ${id}: ${error instanceof Error ? error.message : "Unknown error"}`
                );
            }
        }
        res.status(200).json(result);
    })
);

export default router;
