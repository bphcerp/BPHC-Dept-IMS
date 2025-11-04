import { Router } from "express";
import db from "../../config/db/index.ts";
import {
  projects,
  investigators,
  fundingAgencies,
  projectCoPIs,
  projectPIs,
} from "../../config/db/schema/project.ts";
import { eq, and } from "drizzle-orm";
import { checkAccess } from "@/middleware/auth.ts";
import { asyncHandler } from "@/middleware/routeHandler.ts";

const router = Router();

router.post(
  "/",
  checkAccess("project:create"),
  asyncHandler(async (req, res) => {
    const {
      title,
      pi,
      coPIs = [],
      PIs = [],
      fundingAgency,
      fundingAgencyNature,
      sanctionedAmount,
      capexAmount,
      opexAmount,
      manpowerAmount,
      approvalDate,
      startDate,
      endDate,
      hasExtension = false,
    } = req.body;

    if (!title || !pi || !fundingAgency || !fundingAgencyNature || !sanctionedAmount || !approvalDate || !startDate || !endDate) {
      res.status(400).json({ error: "Missing required fields" });
      return;
    }

    let [piRecord] = await db
      .insert(investigators)
      .values(pi)
      .onConflictDoUpdate({
        target: [investigators.email],
        set: pi,
      })
      .returning();
    if (!piRecord) {
      [piRecord] = await db.select().from(investigators).where(eq(investigators.email, pi.email));
    }

    let [agencyRecord] = await db
      .insert(fundingAgencies)
      .values({ name: fundingAgency })
      .onConflictDoNothing()
      .returning();
    if (!agencyRecord) {
      [agencyRecord] = await db.select().from(fundingAgencies).where(eq(fundingAgencies.name, fundingAgency));
    }
    const normalizedAgencyName = fundingAgency.trim().toLowerCase();
    const duplicate = await db
      .select()
      .from(projects)
      .innerJoin(fundingAgencies, eq(projects.fundingAgencyId, fundingAgencies.id))
      .where(and(
        eq(projects.title, title),
        eq(projects.piId, piRecord.id),
        eq(fundingAgencies.name, normalizedAgencyName),
        eq(projects.sanctionedAmount, sanctionedAmount),
        eq(projects.approvalDate, approvalDate),
        eq(projects.startDate, startDate),
        eq(projects.endDate, endDate)
      ));
    if (duplicate.length > 0) {
      res.status(409).json({ error: "Project already exists" });
      return;
    }

    const coPIRecords: any[] = [];
    for (const coPI of coPIs) {
      let [coPIRecord] = await db
        .insert(investigators)
        .values(coPI)
        .onConflictDoUpdate({
          target: [investigators.email],
          set: coPI,
        })
        .returning();
      if (!coPIRecord) {
        [coPIRecord] = await db.select().from(investigators).where(eq(investigators.email, coPI.email));
      }
      coPIRecords.push(coPIRecord);
    }
    const PIRecords: any[] = [];
    for (const PI of PIs) {
      let [PIRecord] = await db
        .insert(investigators)
        .values(PI)
        .onConflictDoUpdate({
          target: [investigators.email],
          set: PI,
        })
        .returning();
      if (!PIRecord) {
        [PIRecord] = await db.select().from(investigators).where(eq(investigators.email, PI.email));
      }
      PIRecords.push(PIRecord);
    }

    const [project] = await db
      .insert(projects)
      .values({
        title,
        piId: piRecord.id,
        fundingAgencyId: agencyRecord.id,
        fundingAgencyNature,
        sanctionedAmount,
        capexAmount: capexAmount && capexAmount !== "" ? capexAmount : null,
        opexAmount: opexAmount && opexAmount !== "" ? opexAmount : null,
        manpowerAmount: manpowerAmount && manpowerAmount !== "" ? manpowerAmount : null,
        approvalDate,
        startDate,
        endDate,
        hasExtension,
      })
      .returning();

    for (const coPIRecord of coPIRecords) {
      await db.insert(projectCoPIs).values({
        projectId: project.id,
        investigatorId: coPIRecord.id,
      }).onConflictDoNothing();
    }
    for (const PIRecord of PIRecords) {
      await db.insert(projectPIs).values({
        projectId: project.id,
        investigatorId: PIRecord.id,
      }).onConflictDoNothing();
    }

    res.status(201).json({
      ...project,
      pi: piRecord,
      coPIs: coPIRecords,
      PIs: PIRecords,
      fundingAgency: agencyRecord,
    });
  })
);

export default router; 