import db from "@/config/db/index.ts";
import { wilpProject } from "@/config/db/schema/wilpProject.ts";
import { checkAccess } from "@/middleware/auth.ts";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import { and, count, eq, isNull } from "drizzle-orm";
import { Router } from "express";

const router = Router();
const selectRange: {
    min: number;
    max: number;
} = {
    min: 3,
    max: 4,
};

router.patch(
    "/",
    checkAccess("wilp:project:select"),
    asyncHandler(async (req, res) => {
        const { idList }: { idList: string[] } = req.body;

        if (!req.user?.email) {
            res.status(401).json({ error: "Unauthorized" });
            return;
        }
        if (!idList || !Array.isArray(idList)) {
            res.status(400).json({ error: "Invalid idList" });
            return;
        }
        if (!idList.length) {
            res.status(400).json({ error: "idList cannot be empty" });
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
        if (
            selected[0].count + idList.length < selectRange.min ||
            selected[0].count + idList.length > selectRange.max
        ) {
            const minSelect = selectRange.min - selected[0].count;
            const maxSelect = selectRange.max - selected[0].count;
            if (maxSelect <= 0) {
                res.status(400).json({
                    error: `Project selection limit exceeded. You can only select up to ${selectRange.max} projects.`,
                });
                return;
            }
            res.status(400).json({
                error: `Please provide ${minSelect}${
                    minSelect !== maxSelect ? ` to ${maxSelect}` : ""
                } projects.`,
            });
            return;
        }

        let result: {
            total: number;
            successful: number;
            failed: number;
            errors: string[];
        } = {
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
                            eq(wilpProject.id, id),
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
                    `Error selecting ${id} project: ${error instanceof Error ? error.message : "Unknown error"}`
                );
            }
        }
        res.status(200).json(result);
    })
);

export default router;
