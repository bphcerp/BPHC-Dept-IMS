import express from "express";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import db from "@/config/db/index.ts";
import { users } from "@/config/db/schema/admin.ts";
import { eq } from "drizzle-orm";
import { projects, investigators } from "@/config/db/schema/project.ts";

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

        const projectsData = await db
            .select({
                project: projects,
            })
            .from(projects)
            .rightJoin(investigators, eq(investigators.id, projects.piId))
            .where(eq(investigators.email, userEmail));
        const parsedProjectsData = projectsData.map((item) => item.project);

        res.status(200).json({ ...data[0], projects: parsedProjectsData });
    })
);

export default router;
