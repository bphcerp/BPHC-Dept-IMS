import { patents, patentInventors, users } from '@/config/db/schema/patents.ts'; 
import express from 'express';
import db from '@/config/db/index.ts';
import { asyncHandler } from '@/middleware/routeHandler.ts';
import { checkAccess } from '@/middleware/auth.ts';
import { HttpCode, HttpError } from '@/config/errors.ts';
import { patentsSchemas } from '@/validations/patentsSchemas.ts'; 

const router = express.Router();

router.get(
    "/:name/patents",
    asyncHandler(async (req, res, next) => {
        // Validate request parameters
        const parsed = patentsSchemas.getPatentsByInventorParamsSchema.safeParse(req.params);
        if (!parsed.success) {
            return next(new HttpError(HttpCode.BAD_REQUEST, parsed.error.errors));
        }

        const { name } = parsed.data;

        // Find the inventor
        const inventorData = await db.query.users.findFirst({
            where: (user, { eq }) => eq(user.name, name),
            columns: { id: true },
        });

        if (!inventorData) {
            return res.status(404).json({ error: "Inventor not found" });
        }

        const inventorId = inventorData.id;

        // Find patents associated with this inventor
        const inventorPatents = await db.query.patents.findMany({
            where: (patent, { like }) => like(patent.inventorsName, `%${name}%`),
        });

        res.status(200).json(inventorPatents);
    })
);

export default router;
