import db from "@/config/db/index.ts";
import { checkAccess } from "@/middleware/auth.ts";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import { Router } from "express";

const router = Router();

router.get('/',checkAccess(), asyncHandler(async (_req, res) => {
    try {
        const vendors = await db.query.vendors.findMany();

        const vendorCategoryLinks = await db.query.vendorCategories.findMany();

        const allCategories = await db.query.inventoryCategories.findMany();

        const vendorMap = vendors.map((vendor) => {
            const relatedCategoryIds = vendorCategoryLinks
                .filter(link => link.vendorId === vendor.id)
                .map(link => link.categoryId);

            const categories = allCategories.filter(cat =>
                relatedCategoryIds.includes(cat.id)
            );

            return {
                ...vendor,
                categories,
            };
        });

        res.status(200).json(vendorMap);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error fetching vendors with categories', error });
    }
}));


export default router;
