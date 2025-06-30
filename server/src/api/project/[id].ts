import { Router } from "express";
import db from "@/config/db/index.ts";
import {
  projects,
  investigators,
  fundingAgencies,
  projectCoPIs,
} from "@/config/db/schema/project.ts";
import { eq, inArray } from "drizzle-orm";
import { checkAccess } from "@/middleware/auth.ts";
import { asyncHandler } from "@/middleware/routeHandler.ts";

const router = Router();

router.get(
  "/:id",
  checkAccess(),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const [project] = await db
      .select({
        id: projects.id,
        title: projects.title,
        piId: projects.piId,
        fundingAgencyId: projects.fundingAgencyId,
        fundingAgencyNature: projects.fundingAgencyNature,
        sanctionedAmount: projects.sanctionedAmount,
        capexAmount: projects.capexAmount,
        opexAmount: projects.opexAmount,
        manpowerAmount: projects.manpowerAmount,
        approvalDate: projects.approvalDate,
        startDate: projects.startDate,
        endDate: projects.endDate,
        hasExtension: projects.hasExtension,
        extensionDetails: projects.extensionDetails,
        createdAt: projects.createdAt,
        updatedAt: projects.updatedAt,
        piName: investigators.name,
        piEmail: investigators.email,
        fundingAgencyName: fundingAgencies.name,
      })
      .from(projects)
      .leftJoin(investigators, eq(projects.piId, investigators.id))
      .leftJoin(fundingAgencies, eq(projects.fundingAgencyId, fundingAgencies.id))
      .where(eq(projects.id, id));
    if (!project) {
      res.status(404).json({ error: "Project not found" });
      return;
    }
    const coPILinks = await db.select().from(projectCoPIs).where(eq(projectCoPIs.projectId, id));
    const coPIIds = coPILinks.map((link) => link.investigatorId).filter((id): id is string => !!id);
    let coPIs: any[] = [];
    if (coPIIds.length) {
      coPIs = await db.select().from(investigators).where(inArray(investigators.id, coPIIds));
    }
    res.json({ ...project, coPIs });
  })
);

export default router; 