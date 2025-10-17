import express from "express";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import db from "@/config/db/index.ts";
import { faculty, users } from "@/config/db/schema/admin.ts";
import { desc, eq } from "drizzle-orm";
import {
    projects,
    investigators,
    projectCoPIs,
} from "@/config/db/schema/project.ts";
import { patents, patentInventors } from "@/config/db/schema/patents.ts";
import {
    publicationsTable,
    authorPublicationsTable,
} from "@/config/db/schema/publications.ts";

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
        const parsedProjectsData = await getProjectDataByEmail(userEmail);
        // patents
        const parsedPatentsData = await getPatentsDataByEmail(userEmail);
        // publications
        const parsedPublicationsData =
            await getPublicationsDataByEmail(userEmail);

        res.status(200).json({
            ...data[0],
            projects: parsedProjectsData,
            patents: parsedPatentsData,
            publications: parsedPublicationsData,
        });
    })
);

export async function getProjectDataByEmail(userEmail: string) {
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
    return parsedProjectsData;
}

export async function getPatentsDataByEmail(userEmail: string) {
    const patentsData = await db
        .select({
            patent: patents,
        })
        .from(patents)
        .innerJoin(patentInventors, eq(patentInventors.patentId, patents.id))
        .where(eq(patentInventors.email, userEmail));
    const parsedPatentsData = patentsData.map((item) => item.patent);
    return parsedPatentsData;
}

export async function getPublicationsDataByEmail(userEmail: string) {
    const publicationsData = await db
        .select({
            publication: publicationsTable,
        })
        .from(publicationsTable)
        .innerJoin(
            authorPublicationsTable,
            eq(authorPublicationsTable.citationId, publicationsTable.citationId)
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
    return parsedPublicationsData;
}

export default router;
