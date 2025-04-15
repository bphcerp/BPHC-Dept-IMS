import db from "@/config/db/index.ts";
import { inventoryCategories, vendorCategories, vendors } from "@/config/db/schema/inventory.ts";
import { checkAccess } from "@/middleware/auth.ts";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import { eq } from "drizzle-orm";
import { Router } from "express";
import { Vendor } from "node_modules/lib/src/types/inventory.ts";

const router = Router();

router.get('/', checkAccess(), asyncHandler(async (_req, res) => {
    try {

        const data = await db
            .select({
                vendor: vendors,
                category: inventoryCategories,
            })
            .from(vendors)
            .leftJoin(vendorCategories, eq(vendorCategories.vendorId, vendors.id))
            .leftJoin(inventoryCategories, eq(vendorCategories.categoryId, inventoryCategories.id));

        const groupedResult = data.reduce((acc, { vendor, category }) => {
            const existing = acc.find(v => v.id === vendor.id);
            if (existing) {
                if (category) existing.categories.push(category);
            } else {
                acc.push({
                    ...vendor,
                    categories: category ? [category] : [],
                });
            }
            return acc;
        }, [] as Vendor[]);


        res.status(200).json(groupedResult);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching laboratory stats per category', error });
        console.error(error);
    }
}))

export default router