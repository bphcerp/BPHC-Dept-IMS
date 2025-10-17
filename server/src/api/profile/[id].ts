// This route is not authenticated, but it can be accessed by authenticated users.
// This was done so that the profile can be viewed by anyone.
import express from "express";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import db from "@/config/db/index.ts";
import { faculty, users } from "@/config/db/schema/admin.ts";
import { desc, eq } from "drizzle-orm";
import { optionalAuth } from "@/middleware/optionalAuth.ts";
import {
    investigators,
    projectCoPIs,
    projects,
} from "@/config/db/schema/project.ts";
import { patentInventors, patents } from "@/config/db/schema/patents.ts";
import {
    authorPublicationsTable,
    publicationsTable,
} from "@/config/db/schema/publications.ts";

const router = express.Router();

router.get(
    "/:id",
    optionalAuth,
    asyncHandler(async (req, res) => {
        const { id } = req.params;
        const parsedID = Number(id);
        if (!Number.isInteger(parsedID) || parsedID <= 0) {
            res.status(400).json({ message: "Invalid profile ID" });
            return;
        }

        const data = await db
            .select()
            .from(users)
            .where(eq(users.id, parsedID));

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

        // publications
        const publicationsData = await db
            .select({
                publication: publicationsTable,
            })
            .from(publicationsTable)
            .innerJoin(
                authorPublicationsTable,
                eq(
                    authorPublicationsTable.citationId,
                    publicationsTable.citationId
                )
            )
            .innerJoin(
                faculty,
                eq(faculty.authorId, authorPublicationsTable.authorId)
            )
            .where(eq(faculty.email, userEmail))
            .orderBy(desc(publicationsTable.year));
        const parsedPublicationsData = publicationsData.map(
            (item) => item.publication
        );

        // add all the data together
        var parsedData = {
            ...data[0],
            projects: parsedProjectsData,
            patents: parsedPatentsData,
            publications: parsedPublicationsData,
        };
        if (!req.user) parsedData.phone = null;
        else if (
            parsedData.email !== req.user.email &&
            !req.user.permissions.allowed.includes("admin:member:read") &&
            !req.user.permissions.allowed.includes("*")
        )
            parsedData.phone = null;

        res.status(200).json(parsedData);
    })
);

export default router;
