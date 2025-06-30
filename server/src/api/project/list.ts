import { Request, Response, Router } from "express";
import db from "@/config/db/index.ts";
import {
  projects,
  investigators,
  fundingAgencies,
} from "@/config/db/schema/project.ts";
import { eq } from "drizzle-orm";
import { checkAccess } from "@/middleware/auth.ts";
import { asyncHandler } from "@/middleware/routeHandler.ts";

const router = Router();

router.get(
  "/",
  checkAccess("project:view"),
  asyncHandler(async (_req: Request, res: Response) => {
    const result = await db
      .select({
        id: projects.id,
        title: projects.title,
        piName: investigators.name,
        piEmail: investigators.email,
        fundingAgencyName: fundingAgencies.name,
        fundingAgencyNature: projects.fundingAgencyNature,
        sanctionedAmount: projects.sanctionedAmount,
        capexAmount: projects.capexAmount,
        opexAmount: projects.opexAmount,
        manpowerAmount: projects.manpowerAmount,
        startDate: projects.startDate,
        endDate: projects.endDate,
        approvalDate: projects.approvalDate,
        hasExtension: projects.hasExtension,
        extensionDetails: projects.extensionDetails,
        createdAt: projects.createdAt,
        updatedAt: projects.updatedAt,
      })
      .from(projects)
      .leftJoin(investigators, eq(projects.piId, investigators.id))
      .leftJoin(fundingAgencies, eq(projects.fundingAgencyId, fundingAgencies.id));
    res.json(result);
  })
);

export default router; 