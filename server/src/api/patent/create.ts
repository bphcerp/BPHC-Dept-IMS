import { Request, Response, Router } from "express";
import db from "@/config/db/index.ts";
import { patents, patentInventors } from "@/config/db/schema/patents.ts";
import { patentSchemas } from "lib";
import { checkAccess } from "@/middleware/auth.ts";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import { eq } from "drizzle-orm";

const router = Router();

router.post(
  "/",
  checkAccess("patent:create"),
  asyncHandler(async (req: Request, res: Response) => {
    console.log("Received patent data:", req.body);
    console.log("Schema keys:", Object.keys(patentSchemas.patentSchema.shape));

    try {
      const validatedData = patentSchemas.patentSchema.parse(req.body);
      console.log("Validated data:", validatedData);

      const existingPatent = await db
        .select()
        .from(patents)
        .where(eq(patents.applicationNumber, validatedData.applicationNumber));

      if (existingPatent.length > 0) {
        res.status(400).json({
          success: false,
          error: "Duplicate patent",
          message: `A patent with application number "${validatedData.applicationNumber}" already exists.`
        });
        return;
      }

      const patentId = crypto.randomUUID();

      const newPatent = await db.insert(patents).values({
        ...validatedData,
        id: patentId,
      }).returning();

      if (validatedData.inventors && validatedData.inventors.length > 0) {
        const inventorRecords = validatedData.inventors.map(inventor => ({
          patentId: patentId,
          name: inventor.name,
          email: inventor.email || null,
          department: validatedData.department,
          campus: validatedData.campus,
          affiliation: null, // Can be added later if needed
        }));

        await db.insert(patentInventors).values(inventorRecords);
      }

      res.status(201).json({
        success: true,
        data: newPatent[0],
      });
    } catch (error) {
      console.error("Validation error:", error);
      throw error;
    }
  })
);

export default router; 