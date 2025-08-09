// server/src/api/phd/staff/sub-areas.ts
import express from "express";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import { checkAccess } from "@/middleware/auth.ts";
import db from "@/config/db/index.ts";
import { phdSubAreas } from "@/config/db/schema/phd.ts";
import { HttpError, HttpCode } from "@/config/errors.ts";
import { eq } from "drizzle-orm";
import { z } from "zod";

const router = express.Router();

// GET /phd/staff/sub-areas - List all sub-areas
router.get("/", checkAccess(), asyncHandler(async (req, res) => {
  const subAreas = await db.select()
    .from(phdSubAreas)
    .where(eq(phdSubAreas.isActive, true));

  res.status(200).json({
    success: true,
    subAreas,
  });
}));

// POST /phd/staff/sub-areas - Create/Update sub-areas
const subAreasSchema = z.object({
  subAreas: z.array(z.object({
    subarea: z.string().min(1),
  })),
});

router.post("/", checkAccess(), asyncHandler(async (req, res) => {
  const parsed = subAreasSchema.parse(req.body);
  
  const created = [];
  for (const subArea of parsed.subAreas) {
    // Check if sub-area already exists
    const existing = await db.query.phdSubAreas.findFirst({
      where: (areas, { eq }) => eq(areas.subarea, subArea.subarea),
    });

    if (!existing) {
      const newSubArea = await db.insert(phdSubAreas)
        .values({
          subarea: subArea.subarea,
        })
        .returning();
      created.push(newSubArea[0]);
    }
  }

  res.status(201).json({
    success: true,
    message: `${created.length} sub-areas created successfully`,
    subAreas: created,
  });
}));

export default router;
