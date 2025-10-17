import express from "express";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import db from "@/config/db/index.ts";
import { users } from "@/config/db/schema/admin.ts";
import { eq } from "drizzle-orm";
import {
    projects,
    investigators,
    projectCoPIs,
} from "@/config/db/schema/project.ts";
import { patents, patentInventors } from "@/config/db/schema/patents.ts";

const router = express.Router();

router.get(
    "/",
    asyncHandler(async (req, res) => {
        if (!req.user) {
            res.status(401).json({ message: "Unauthorized" });
            return;
        }

        const data = await db
            .select()
            .from(users)
            .where(eq(users.email, req.user.email));
        const userEmail = data[0]?.email;
        if (data.length === 0 || !userEmail) {
            res.status(404).json({ message: "Profile not found" });
            return;
        }

        // projects
        const projectsPIData = await db
            .select({
                project: projects,
            })
            .from(projects)
            .innerJoin(investigators, eq(investigators.id, projects.piId))
            .where(eq(investigators.email, userEmail));
        const parsedProjectsPIData = projectsPIData.map((item) => {
            return { ...item.project, role: "PI" };
        });
        const projectsCoPIData = await db
            .select({
                project: projects,
            })
            .from(projects)
            .innerJoin(projectCoPIs, eq(projectCoPIs.projectId, projects.id))
            .innerJoin(
                investigators,
                eq(investigators.id, projectCoPIs.investigatorId)
            )
            .where(eq(investigators.email, userEmail));
        const parsedProjectsCoPIData = projectsCoPIData.map((item) => {
            return { ...item.project, role: "Co-PI" };
        });

        const parsedProjectsData = [
            ...parsedProjectsPIData,
            ...parsedProjectsCoPIData,
        ];

        // patents
        const patentsData = await db
            .select({
                patent: patents,
            })
            .from(patents)
            .innerJoin(
                patentInventors,
                eq(patentInventors.patentId, patents.id)
            )
            .where(eq(patentInventors.email, userEmail));
        const parsedPatentsData = patentsData.map((item) => item.patent);

        res.status(200).json({
            ...data[0],
            projects: parsedProjectsData,
            patents: parsedPatentsData,
        });
    })
);

export default router;
