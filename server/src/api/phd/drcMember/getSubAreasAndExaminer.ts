import express from "express";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import { checkAccess } from "@/middleware/auth.ts";
import db from "@/config/db/index.ts";
import { phdSubAreas, phdExaminer } from "@/config/db/schema/phd.ts";
import { eq } from "drizzle-orm";

const router = express.Router();

router.get(
    "/",
    checkAccess(),
    asyncHandler(async (_req, res) => {
        const subAreas = await db.select().from(phdSubAreas);
        const examiners = await db
            .select({
                id: phdExaminer.id,
                subAreaId: phdExaminer.subAreaId,
                subArea: phdSubAreas.subarea,
                suggestedExaminer: phdExaminer.suggestedExaminer,
                examiner: phdExaminer.examiner,
            })
            .from(phdExaminer)
            .innerJoin(phdSubAreas, eq(phdExaminer.subAreaId, phdSubAreas.id)); 

        const mappedSubAreas = subAreas.map((subArea) => ({
            ...subArea,
            examiners: examiners
                .filter((examiner) => examiner.subAreaId === subArea.id)
                .map(({ subAreaId, ...rest }) => rest),
        }));

        res.status(200).json({ success: true, subAreas: mappedSubAreas });
    })
);

export default router;
