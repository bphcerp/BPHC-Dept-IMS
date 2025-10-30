import db from "@/config/db/index.ts";
import { allocationSection } from "@/config/db/schema/allocation.ts";
import { HttpCode, HttpError } from "@/config/errors.ts";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import express from "express";
import { allocationSchemas } from "lib";
import { checkAccess } from "@/middleware/auth.ts";

const router = express.Router();

router.post(
    "/",
    checkAccess(),
    asyncHandler(async (req, res, next) => {
        const { masterId, sectionType } =
            allocationSchemas.addSectionBodySchema.parse(req.body);
        
        const masterAllocation = await db.query.masterAllocation.findFirst({
            with: {
                course: true
            },
            where: (masterAllocation , { eq }) => eq(masterAllocation.id, masterId)
        })

        if (!masterAllocation) return next(new HttpError(HttpCode.BAD_REQUEST, "Allocation not found. masterId is invalid"));
        
        if (sectionType === 'PRACTICAL' && !masterAllocation.course.practicalUnits) return next(new HttpError(HttpCode.BAD_REQUEST, "This course doesnt have a practical section"))     
        if (sectionType === 'TUTORIAL' && masterAllocation.course.offeredAs === 'DEL') return next(new HttpError(HttpCode.BAD_REQUEST, "This course is an elective and therefore doesn't have tutorial section"))    
        if (sectionType === 'TUTORIAL' && masterAllocation.course.offeredTo === 'HD') return next(new HttpError(HttpCode.BAD_REQUEST, "This is a Higher Degree Course and therefore doesn't have tutorial section"))    

        await db.insert(allocationSection).values({
            masterId,
            type: sectionType,
        });

        res.status(200).send();
    })
);

export default router;
