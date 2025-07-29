import { Router } from "express";
import db from "@/config/db/index.ts";
import { eq } from "drizzle-orm";
import { checkAccess } from "@/middleware/auth.ts";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import { patents } from "@/config/db/schema/patents.ts";

const router = Router();

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

export default router; 