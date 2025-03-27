import { patents, patentInventors, users } from '@/config/db/schema/patents.ts'; 
import express from 'express';
import db from '@/config/db/index.ts';
import { asyncHandler } from '@/middleware/routeHandler.ts';
import { checkAccess } from '@/middleware/auth.ts';
import { HttpCode, HttpError } from '@/config/errors.ts';
import { patentsSchemas } from '@/validations/patentsSchemas.ts'; 

const router = express.Router();

router.get(
    '/:name/patents',
    checkAccess('patents:view_by_inventor'),
    asyncHandler(async (req, res, next) => {
        // Validate request parameters using Zod
        const parsedParams = patentsSchemas.getPatentsByInventorParamsSchema.safeParse(req.params);
        if (!parsedParams.success) {
            return next(new HttpError(HttpCode.BAD_REQUEST, 'Invalid inventor name'));
        }

        const { name } = parsedParams.data;

        // Step 1: Retrieve all patents where the given inventor is associated
        const inventorData = await db.query.users.findFirst({
            where: (user, { eq }) => eq(user.name, name),
            columns: { id: true }
        });

        if (!inventorData) {
            return next(new HttpError(HttpCode.NOT_FOUND, 'Inventor not found'));
        }

        const inventorId = inventorData.id;

        // Step 2: Get all patent IDs linked to this inventor
        const inventorPatents = await db.query.patentInventors.findMany({
            where: (patentInventor, { eq }) => eq(patentInventor.user_id, inventorId),
            columns: { patent_id: true }
        });

        if (!inventorPatents.length) {
            return res.status(200).json([]); // No patents found
        }

        const patentIds = inventorPatents.map((p) => p.patent_id);

        // Step 3: Fetch all patents where patent_id matches
        const patentData = await db.query.patents.findMany({
            where: (patent, { inArray }) => inArray(patent.patent_id, patentIds)
        });

        // Step 4: Fetch inventor details for each patent
        const patentsWithInventors = await Promise.all(
            patentData.map(async (patent) => {
                const associatedInventors = await db.query.patentInventors.findMany({
                    where: (pi, { eq }) => eq(pi.patent_id, patent.patent_id),
                    columns: { user_id: true }
                });

                const inventorIds = associatedInventors.map((inv) => inv.user_id);

                const inventorDetails = await db.query.users.findMany({
                    where: (user, { inArray }) => inArray(user.id, inventorIds),
                    columns: { name: true, email: true }
                });

                return { ...patent, inventors: inventorDetails };
            })
        );

        res.status(200).json(patentsWithInventors);
    })
);

export default router;
