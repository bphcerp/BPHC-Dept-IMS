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
    '/Allpatents',
    checkAccess('patents:view_all'),
    asyncHandler(async (req, res, next) => {
        // Validate query parameters using Zod
        const parsedQuery = patentsSchemas.getAllPatentsQuerySchema.safeParse(req.query);
        if (!parsedQuery.success) {
            return next(new HttpError(HttpCode.BAD_REQUEST, 'Invalid query parameters'));
        }

        // Fetch all patents
        let patentsQuery = db.select().from(excelPatents);

        // If inventor query param exists, filter patents by inventor name
        if (parsedQuery.data.inventor) {
            patentsQuery = patentsQuery.where(({ inventors_name }, { like }) =>
                like(inventors_name, `%${parsedQuery.data.inventor}%`)
            );
        }

        const patentsData = await patentsQuery;

        if (!patentsData.length) {
            return next(new HttpError(HttpCode.NOT_FOUND, 'No patents found'));
        }

        // Extract all inventor names from patents
        const inventorNames = new Set();
        patentsData.forEach((patent) => {
            if (patent.inventors_name) {
                patent.inventors_name.split(',').forEach((name) => {
                    inventorNames.add(name.trim());
                });
            }
        });

        // Fetch emails of inventors from users table
        const usersData = await db
            .select({ name: users.name, email: users.email })
            .from(users)
            .where(inArray(users.name, Array.from(inventorNames)));

        // Create a mapping of inventor names to emails
        const emailMap = Object.fromEntries(
            usersData.map((user) => [user.name, user.email])
        );

        // Attach emails to inventors
        const enrichedPatents = patentsData.map((patent) => {
            const inventorDetails = (patent.inventors_name || '')
                .split(',')
                .map((name) => {
                    name = name.trim();
                    return `${name} (${emailMap[name] || 'No Email'})`;
                })
                .join(', ');

            return { ...patent, inventors_with_email: inventorDetails };
        });

        res.status(200).json(enrichedPatents);
    })
);

export default router;
