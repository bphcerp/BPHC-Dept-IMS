import { excelPatents, users } from '@/config/db/schema/patents.ts';
import express from 'express';
import db from '@/config/db/index.ts';
import { asyncHandler } from '@/middleware/routeHandler.ts';
import { checkAccess } from '@/middleware/auth.ts';
import { HttpCode, HttpError } from '@/config/errors.ts';
import { inArray } from 'drizzle-orm';
import { patentsSchemas } from '@/validations/patentsSchemas.ts'; 

const router = express.Router();

router.get(
    "/Allpatents",
    asyncHandler(async (req, res, next) => {
        // Validate query parameters
        const parsed = patentsSchemas.getAllPatentsQuerySchema.safeParse(req.query);
        if (!parsed.success) {
            return next(new HttpError(HttpCode.BAD_REQUEST, parsed.error.errors));
        }

        const { inventor } = parsed.data;
        let query = db.select().from(excelPatents);

        // If filtering by inventor name
        if (inventor) {
            query = query.where(({ inventorsName }, { like }) => like(inventorsName, `%${inventor}%`));
        }

        const patentsData = await query;
        if (!patentsData.length) {
            return res.status(404).json({ error: "No patents found" });
        }

        res.status(200).json(patentsData);
    })
);

export default router;
