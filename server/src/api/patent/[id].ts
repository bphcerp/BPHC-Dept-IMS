import { Router } from "express";
import db from "@/config/db/index.ts";
import { eq } from "drizzle-orm";
import { checkAccess } from "@/middleware/auth.ts";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import { patents } from "@/config/db/schema/patents.ts";
import { z } from "zod";

const router = Router();

const patentUpdateSchema = z.object({
  applicationNumber: z.string().optional(),
  inventorsName: z.string().optional(),
  department: z.string().optional(),
  title: z.string().optional(),
  campus: z.string().optional(),
  filingDate: z.string().optional(),
  applicationPublicationDate: z.string().optional(),
  grantedDate: z.string().optional(),
  filingFY: z.string().optional(),
  filingAY: z.string().optional(),
  publishedAY: z.string().optional(),
  publishedFY: z.string().optional(),
  grantedFY: z.string().optional(),
  grantedAY: z.string().optional(),
  grantedCY: z.string().optional(),
  status: z.enum(["Pending", "Filed", "Granted", "Abandoned", "Rejected"]).optional(),
  grantedPatentCertificateLink: z.string().optional(),
  applicationPublicationLink: z.string().optional(),
  form01Link: z.string().optional(),
});

router.get(
  "/:id",
  checkAccess("patent:view-details"),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const [patent] = await db
      .select()
      .from(patents)
      .where(eq(patents.id, id));
    
    if (!patent) {
      res.status(404).json({ error: "Patent not found" });
      return;
    }
    
    res.json(patent);
  })
);

router.put(
  "/:id",
  checkAccess("patent:edit-all"),
  asyncHandler(async (req, res) => {
    const { id } = req.params;

    // Check if patent exists
    const [existingPatent] = await db
      .select()
      .from(patents)
      .where(eq(patents.id, id));

    if (!existingPatent) {
      res.status(404).json({ error: "Patent not found" });
      return;
    }

    const updateData = patentUpdateSchema.parse(req.body);

    const [updatedPatent] = await db
      .update(patents)
      .set({
        ...updateData,
        updatedAt: new Date(),
      })
      .where(eq(patents.id, id))
      .returning();

    res.json({
      success: true,
      data: updatedPatent,
    });
  })
);

export default router; 