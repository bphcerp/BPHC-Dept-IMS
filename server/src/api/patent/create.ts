import { Request, Response, Router } from "express";
import db from "@/config/db/index.ts";
import { patents } from "@/config/db/schema/patents.ts";
import { patentSchemas } from "lib";
import { checkAccess } from "@/middleware/auth.ts";
import { asyncHandler } from "@/middleware/routeHandler.ts";

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
      
      const newPatent = await db.insert(patents).values({
        ...validatedData,
        id: crypto.randomUUID(),
      }).returning();

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